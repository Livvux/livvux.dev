import test from 'node:test';
import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import { EventEmitter } from 'node:events';
import https from 'node:https';
import { normalizeUrl, isPublicAddress, resolvePublic, safeGet, AuditError, inScope, createGate } from '../src/lib/internal-links/network.mjs';
import { decodeEntities } from '../src/lib/internal-links/entities.mjs';
import { extractPage } from '../src/lib/internal-links/extract.mjs';
import { parseRobots, sitemapLocations, globMatch } from '../src/lib/internal-links/robots.mjs';
import { crawl, canonicalize } from '../src/lib/internal-links/crawl.mjs';
import { tfidf, placements, candidateTargets, runAudit } from '../src/lib/internal-links/analysis.mjs';
import { createJev, MODEL, choice } from '../src/lib/internal-links/provider.mjs';
import { csvCell, reportCsv, readEvents } from '../src/lib/internal-links/shared.mjs';
import { handleAudit } from '../src/lib/internal-links/server.mjs';

const signal = () => new AbortController().signal;
const site = 'https://example.com/';
const html = (title, body, extra = '') => `<!doctype html><html lang="en"><head><title>${title}</title>${extra}</head><body><nav><a href="/">Home</a><a href="/privacy">Privacy</a></nav><main>${body}</main></body></html>`;
const response = (text, status = 200, headers = {}) => ({ status, text, bytes: Buffer.byteLength(text), headers: { 'content-type': 'text/html; charset=utf-8', ...headers } });
const documents = {
  '/robots.txt': response('User-agent: *\nAllow: /\nDisallow: /secret\nSitemap: https://example.com/sitemap.xml', 200, { 'content-type': 'text/plain' }),
  '/sitemap.xml': response('<urlset><url><loc>https://example.com/</loc></url><url><loc>https://example.com/tuning</loc></url><url><loc>https://example.com/maintenance</loc></url><url><loc>https://example.com/secret</loc></url></urlset>', 200, { 'content-type': 'application/xml' }),
  '/': response(html('Piano workshop', '<h1>Piano workshop</h1><p>Professional piano tuning and maintenance improve your instrument.</p>')),
  '/tuning': response(html('Piano tuning guide', '<h1>Piano tuning</h1><p>Regular piano maintenance keeps the instrument in good condition.</p><p>Our piano tuning guide explains tuning stability and seasonal changes.</p>')),
  '/maintenance': response(html('Piano maintenance', '<h1>Piano maintenance</h1><p>Piano maintenance includes humidity control and regular piano tuning.</p>')),
};
function mockGet(log = [], overrides = {}) { return async (url, sig) => { sig.throwIfAborted(); log.push(url); return { url, ...(overrides[url] ?? documents[new URL(url).pathname] ?? response('', 404)) }; }; }
function decision(value) { return { type: 'choice', choice: value, confidence: 0.9, probabilities: { [value]: 1 } }; }
function fakeJev() { return { usage: { requests: 0, inputTokens: 0, outputTokens: 0, cost: 0, model: MODEL, estimated: true }, async validate() {}, clear() {}, async ask(state, questions) {
  this.usage.requests++; this.usage.inputTokens += 100;
  if (questions.type) return { type: decision(state.url === site ? 'home' : 'support_article'), intent: decision('informational') };
  return Object.fromEntries(Object.entries(questions).map(([id, question]) => [id, question.type === 'noul' ? { type: 'noul', noul: 0.88 } : decision(Object.keys(question.criteria)[0])]));
} }; }

for (const url of ['http://127.0.0.1', 'http://127.1', 'http://2130706433', 'http://0x7f000001', 'http://10.1.2.3', 'http://169.254.169.254', 'http://100.100.100.200', 'http://[::1]', 'http://[::ffff:8.8.8.8]', 'http://localhost', 'https://service.internal', 'file:///etc/passwd', 'https://user:pass@example.com', 'https://example.com:8080']) {
  test(`reject unsafe URL ${url}`, () => assert.throws(() => normalizeUrl(url), AuditError));
}
test('URL normalisation preserves query and strips fragments', () => assert.equal(normalizeUrl('EXAMPLE.com/a?q=1#part'), 'https://example.com/a?q=1'));
test('scope accepts www alias, rejects subdomains and lookalikes', () => { assert.ok(inScope('https://www.example.com/a', site)); assert.ok(!inScope('https://example.com.evil.org/', site)); assert.ok(!inScope('https://other.example.com/', site)); });
test('public IPv4 and IPv6 allowlist excludes special-purpose networks', () => { assert.ok(isPublicAddress('8.8.8.8')); assert.ok(isPublicAddress('2606:4700:4700::1111')); for (const address of ['192.0.2.2', '2001:db8::1', '2002:0808:0808::1', 'fc00::1', '168.63.129.16']) assert.ok(!isPublicAddress(address), address); });
test('reject DNS answers containing even one private address', async () => assert.rejects(resolvePublic(site, async () => [{ address: '8.8.8.8', family: 4 }, { address: '127.0.0.1', family: 4 }]), AuditError));
test('pins the validated IP to the actual HTTP lookup and does not follow redirects', async (t) => {
  let captured;
  t.mock.method(https, 'get', (_url, options, done) => { captured = options; const req = new EventEmitter(); req.destroy = () => {}; queueMicrotask(() => { const res = Readable.from([]); res.statusCode = 302; res.headers = { location: 'http://127.0.0.1/' }; done(res); }); return req; });
  const result = await safeGet(site, signal(), { resolver: async () => [{ address: '8.8.8.8', family: 4 }] });
  assert.equal(result.status, 302); assert.equal(captured.agent, false);
  captured.lookup('example.com', {}, (error, address) => { assert.equal(error, null); assert.equal(address, '8.8.8.8'); });
});
test('abort signals stop queued request starts', async () => { const c = new AbortController(); const gate = createGate(); await gate(0, c.signal); const next = gate(10_000, c.signal); c.abort(); await assert.rejects(next); });
test('robots uses specific agent groups, longest rule and allow ties', () => {
  const policy = parseRobots('User-agent: *\nDisallow: /\nUser-agent: LivvuxBot\nDisallow: /private\nAllow: /private/public\nDisallow: /same\nAllow: /same\nCrawl-delay: 2.5');
  assert.ok(policy.allowed(site)); assert.ok(!policy.allowed(site + 'private/a')); assert.ok(policy.allowed(site + 'private/public')); assert.ok(policy.allowed(site + 'same')); assert.equal(policy.delay, 2500);
});
test('robots supports wildcard, query, end anchor and escaped octets', () => {
  const policy = parseRobots('User-agent: *\nDisallow: /*?secret=*\nDisallow: /%7eprivate$\nAllow: /okay');
  assert.ok(!policy.allowed(site + 'a?secret=x')); assert.ok(!policy.allowed(site + '~private')); assert.ok(policy.allowed(site + '~private/a'));
});
test('robots glob matching does not compile untrusted regexes', () => { assert.ok(globMatch('/a*b*', '/aa/bbb')); assert.ok(!globMatch('/a*b$', '/a/b')); assert.ok(!globMatch('a*'.repeat(20) + 'z', 'a'.repeat(2000))); });
test('empty robots disallow allows crawling', () => assert.ok(parseRobots('User-agent: *\nDisallow:').allowed(site)));
test('malformed oversized robots fails closed', () => assert.throws(() => parseRobots('x'.repeat(512001)), AuditError));
test('sitemap parser handles namespaces, index, CDATA and XML entities', () => {
  const parsed = sitemapLocations('<sm:sitemapindex><sm:sitemap><sm:loc><![CDATA[https://example.com/x.xml?a=1&b=2]]></sm:loc></sm:sitemap></sm:sitemapindex>');
  assert.equal(parsed.index, true); assert.equal(parsed.urls[0], site + 'x.xml?a=1&b=2');
  assert.throws(() => sitemapLocations('<!DOCTYPE x [<!ENTITY x SYSTEM "file:///etc/passwd">]>'), AuditError);
});
test('HTML entities include named, numeric, unicode and invalid replacements', () => { assert.equal(decodeEntities('Piano &amp; care &auml; &#x1F3B9; &#128; &#0;'), 'Piano & care ä 🎹 € �'); });
test('extract body vs navigation links and omit script/hidden text', () => {
  const page = extractPage(html('Piano > tuning', '<p>Read <a href="/tuning?a=1&amp;b=2">piano <strong>tuning</strong></a> for stable pitch.</p><p hidden>Never include hidden text</p><script>const x="<a href=/evil>fake</a>"</script>'), site);
  assert.ok(!page.text.includes('hidden')); assert.ok(!page.text.includes('const')); assert.equal(page.links.find((link) => link.anchor === 'Home').contextual, false);
  const link = page.links.find((item) => item.anchor === 'piano tuning'); assert.equal(link.contextual, true); assert.equal(link.target, site + 'tuning?a=1&b=2'); assert.equal(page.title, 'Piano > tuning');
});
test('handles quoted > in attributes and basic omitted end tags', () => {
  const page = extractPage('<html lang=en><title>Test</title><main><p title="a > b">Piano maintenance matters.<p>Regular piano tuning helps.<a href="/care" title="x > y">Care guide</a></main></html>', site);
  assert.equal(page.links[0].target, site + 'care'); assert.ok(page.sentences.some((s) => s.text === 'Piano maintenance matters.'));
});
test('noindex and nofollow are extracted from headers and meta', () => { const page = extractPage(html('Page', '<p>Content for piano maintenance.</p>', '<meta name="robots" content="noindex,nofollow">'), site); assert.ok(page.noindex && page.nofollow); });
test('canonical collapse remaps only fetched targets and preserves cycles', () => {
  const make = (url, canonical) => ({ url, canonical, aliases: [], links: [] });
  const result = canonicalize([make(site, site), make(site + 'a', site + 'b'), make(site + 'b', site + 'a'), make(site + 'c', site + 'missing')]);
  assert.deepEqual(result.pages.map((page) => page.url), [site, site + 'a', site + 'c']); assert.equal(result.aliases.get(site + 'b'), site + 'a');
});
test('TF-IDF weights rare terms and placements are exact, unlinked phrases', () => {
  const source = extractPage(html('Piano care', '<p>Use <a href="/other">piano tuning</a> and improve piano maintenance for lasting stability.</p>'), site + 'source');
  const target = extractPage(html('Piano maintenance', '<p>Piano maintenance improves the instrument and piano maintenance protects its sound.</p>'), site + 'target');
  const index = tfidf([source, target]); const options = placements(source, index.vectors[1], index);
  assert.ok(options.some((option) => option.anchor === 'piano maintenance'));
  for (const option of options) { assert.equal(option.sentence.slice(option.anchorStart, option.anchorStart + option.anchor.length), option.anchor); assert.ok(!source.sentences[0].linked.some((range) => range.end > option.anchorStart && range.start < option.anchorStart + option.anchor.length)); }
});
test('never suggests self links, existing targets, noindex, or cross-language targets', () => {
  const pages = ['source', 'existing', 'noindex', 'otherlanguage'].map((name) => ({ url: site + name, title: 'Piano tuning', text: 'Piano tuning maintenance', language: name === 'otherlanguage' ? 'de' : 'en', type: 'support_article', incomingContextual: 0, noindex: name === 'noindex' }));
  const index = tfidf(pages); assert.equal(candidateTargets(pages[0], pages, index.vectors, new Set([pages[1].url]), 0).length, 0);
});
test('crawl honours robots and sitemap limits', async () => {
  const log = []; const result = await crawl(site, signal(), () => {}, { get: mockGet(log), skipDelay: true });
  assert.equal(result.pages.length, 3); assert.ok(!log.includes(site + 'secret')); assert.ok(result.skipped.some((row) => row.reason === 'Blocked by robots.txt.'));
});
test('redirect to local IP is rejected before a request is sent', async () => {
  const log = []; const result = await crawl(site, signal(), () => {}, { get: mockGet(log, { [site + 'tuning']: response('', 302, { location: 'http://127.0.0.1/admin' }) }), skipDelay: true });
  assert.ok(!log.some((url) => url.includes('127.0.0.1'))); assert.ok(result.skipped.some((row) => row.url.endsWith('/tuning')));
});
test('robots failure stops the crawl instead of permitting it', async () => assert.rejects(crawl(site, signal(), () => {}, { get: async () => response('', 503), skipDelay: true }), /robots/));
test('crawl with no sitemap follows internal links', async () => {
  const result = await crawl(site, signal(), () => {}, { skipDelay: true, get: async (url) => url.endsWith('/robots.txt') ? response('', 404) : url === site ? response(html('Home', '<p><a href="/article">Read article</a> for more information.</p>')) : url.endsWith('/article') ? response(html('Article', '<p>Useful information on piano maintenance and tuning.</p>')) : response('', 404) });
  assert.ok(result.pages.some((page) => page.url.endsWith('/article')));
});
test('page cap produces an explicitly partial result', async () => { const result = await crawl(site, signal(), () => {}, { get: mockGet(), skipDelay: true, maxPages: 1 }); assert.equal(result.pages.length, 1); assert.ok(result.partial); });
test('full audit produces real placements, page counts, weak map and exports', async () => {
  const events = []; const report = await runAudit(site, signal(), (event) => events.push(event), fakeJev(), { get: mockGet(), skipDelay: true });
  assert.equal(report.pages.length, 3); assert.equal(report.suggestions.length, 2); assert.ok(report.weakPages.length >= 2);
  assert.ok(report.suggestions.every((link) => link.source !== site && link.target !== site && link.sentence.includes(link.anchor)));
  assert.ok(reportCsv(report).includes('"metadata"')); assert.ok(reportCsv(report).includes('"suggestion"')); assert.equal(events.at(-1).event, 'report');
});
test('provider accepts alias-only model lists and validates inference schema', async () => {
  const calls = [];
  const jev = createJev('ts_fixture_not_a_secret', signal(), () => {}, { skipDelay: true, fetcher: async (url, options) => { calls.push({ url, options }); return Response.json(url.endsWith('/models') ? { models: [{ name: 'jev-latest' }] } : { model: MODEL, answers: { yes: { type: 'noul', noul: 0.9 } }, usage: { input_tokens: 1000, output_tokens: 4 } }); } });
  await jev.validate(); await jev.ask('test', { yes: { type: 'noul', instructions: 'Does this exist?' } });
  assert.equal(calls[0].options.redirect, 'error'); assert.equal(jev.usage.requests, 1); assert.equal(jev.usage.cost, 0.000042);
  assert.equal(JSON.parse(calls[1].options.body).model, MODEL); jev.clear();
});
test('provider auth failure never echoes secret response text', async () => {
  const jev = createJev('ts_fixture_not_a_secret', signal(), () => {}, { skipDelay: true, fetcher: async () => new Response('ts_fixture_not_a_secret upstream details', { status: 403 }) });
  await assert.rejects(jev.validate(), (error) => !error.message.includes('fixture') && error.message.includes('rejected'));
});
test('provider backs off on 429 then retries', async () => { let calls = 0; const jev = createJev('ts_fixture_not_a_secret', signal(), () => {}, { skipDelay: true, fetcher: async () => ++calls === 1 ? new Response('', { status: 429 }) : Response.json({ models: [{ name: 'jev-latest' }] }) }); await jev.validate(); assert.equal(calls, 2); });
test('reject fabricated model choices', () => assert.throws(() => choice(decision('invented'), { known: 'Only this' }), AuditError));
test('CSV quoting and formula injection protection', () => { assert.equal(csvCell('=1+1'), '"\'=1+1"'); assert.equal(csvCell('  @SUM(1)'), '"\'  @SUM(1)"'); assert.equal(csvCell('a,"b"\nnext'), '"a,""b""\nnext"'); });
test('NDJSON reader handles split UTF-8 and incomplete final lines', async () => {
  const encoded = new TextEncoder().encode('{"event":"page","title":"🎹 ä"}\n{"event":"heartbeat"}'); let i = 0;
  const stream = new ReadableStream({ pull(controller) { if (i < encoded.length) controller.enqueue(encoded.slice(i, ++i)); else controller.close(); } }); const events = [];
  await readEvents(new Response(stream), (event) => events.push(event)); assert.equal(events[0].title, '🎹 ä'); assert.equal(events.length, 2);
});
const request = (body = { url: site, key: 'ts_fixture_not_a_secret' }, extra = {}) => new Request('https://livvux.dev/api/tools/internal-links', { method: 'POST', headers: { origin: 'https://livvux.dev', 'content-type': 'application/json', ...extra }, body: JSON.stringify(body) });
test('route rejects cross-origin, missing keys and large payloads before crawling', async () => { assert.equal((await handleAudit(request(undefined, { origin: 'https://evil.org' }))).status, 403); assert.equal((await handleAudit(request({ url: site }))).status, 400); assert.equal((await handleAudit(request({ url: site, key: 'x'.repeat(3000) }))).status, 400); });
test('route streams report and clears key on success', async () => {
  let cleared = false; const response = await handleAudit(request(), { makeJev: () => ({ ...fakeJev(), clear() { cleared = true; } }), audit: async (_site, _signal, emit) => emit({ event: 'report', report: { ok: true } }) });
  assert.equal(response.headers.get('cache-control'), 'no-store, private'); const events = []; await readEvents(response, (event) => events.push(event)); assert.ok(cleared); assert.equal(events.at(-1).event, 'report');
});
test('duplicate active key is rejected and disconnect aborts work', async () => {
  let auditSignal; let cleared = false;
  const response = await handleAudit(request(), { makeJev: () => ({ ...fakeJev(), clear() { cleared = true; } }), audit: async (_site, sig) => { auditSignal = sig; await new Promise((resolve) => sig.addEventListener('abort', resolve, { once: true })); } });
  await new Promise((resolve) => setTimeout(resolve, 1));
  assert.equal((await handleAudit(request())).status, 429); await response.body.cancel(); assert.ok(auditSignal.aborted); assert.ok(cleared);
});
test('deadline emits an error rather than a successful empty report', async () => {
  const response = await handleAudit(request(), { duration: 5, makeJev: () => fakeJev(), audit: async (_site, sig) => { await new Promise((resolve) => sig.addEventListener('abort', resolve, { once: true })); sig.throwIfAborted(); } });
  const events = []; await readEvents(response, (event) => events.push(event)); assert.equal(events.at(-1).event, 'error'); assert.ok(events.at(-1).message.includes('time limit'));
});

// Regression: bounded entity matching and full named-reference coverage.
test('decodes multi-codepoint and legacy entities without consuming URL query names', () => {
  assert.equal(decodeEntities('&NotEqualTilde; &fjlig; &Afr;'), '\u2242\u0338 fj \u{1d504}');
  assert.equal(decodeEntities('x&notit=1', true), 'x&notit=1');
  assert.equal(decodeEntities('&copy without a semicolon'), '\u00a9 without a semicolon');
});
test('long unknown entity names remain unchanged without unbounded prefix scans', () => {
  const input = '&' + 'z'.repeat(200_000) + ';';
  assert.equal(decodeEntities(input), input);
});

test('route accepts opaque provider keys without inventing a prefix contract', async () => {
  let seen;
  const response = await handleAudit(request({ url: site, key: 'opaque-provider-key.fixture' }), {
    makeJev: (key) => ({ validate: async () => { seen = key; }, clear() {} }),
    audit: async (_site, _signal, emit) => emit({ event: 'report', report: {} }),
  });
  assert.equal(response.status, 200);
  await response.text();
  assert.equal(seen, 'opaque-provider-key.fixture');
  assert.equal((await handleAudit(request({ url: site, key: 'bad\r\nheader' }))).status, 400);
});

test('canonical HTTPS form works behind the production TLS proxy', async () => {
  const proxied = (origin) => new Request('http://localhost:3000/api/tools/internal-links', {
    method: 'POST', headers: { origin, 'content-type': 'application/json' },
    body: JSON.stringify({ url: 'http://127.0.0.1', key: 'opaque-fixture-key' }),
  });
  const response = await handleAudit(proxied('https://livvux.dev'));
  assert.equal(response.status, 400);
  assert.match((await response.json()).error, /Private/);
  assert.equal((await handleAudit(proxied('https://evil.org'))).status, 403);
});
