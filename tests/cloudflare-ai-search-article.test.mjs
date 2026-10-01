import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const slug = 'cloudflare-ai-search';
const titles = {
  en: 'Cloudflare AI Search Is Now Generally Available: Setup Guide',
  de: 'Cloudflare AI Search ist allgemein verfügbar: Einrichtung',
};
const bodies = {};
const metadata = {};
const docs = 'https://developers.cloudflare.com/ai-search/';
const requiredSources = [
  'https://blog.cloudflare.com/ai-search-ga/',
  ...[
    'concepts/how-ai-search-works/', 'concepts/search-modes/',
    'get-started/dashboard/', 'get-started/wrangler/', 'get-started/workers/',
    'api/search/public-endpoint/', 'api/search/rest-api/',
    'configuration/data-source/', 'configuration/data-source/website/',
    'configuration/models/supported-models/',
    'configuration/retrieval/public-endpoint/',
    'configuration/retrieval/public-endpoint/embed-search-snippets/',
    'platform/limits-pricing/',
  ].map((path) => docs + path),
];
const links = (text) => [...text.matchAll(/\]\(([^)]+)\)/g)].map((match) => match[1]);
const blocks = (text, language) => [...text.matchAll(/^```(\w+)\n([\s\S]*?)^```$/gm)]
  .filter((match) => match[1] === language).map((match) => match[2]);
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;

for (const lang of ['en', 'de']) {
  const content = readFileSync(new URL(`content/${slug}/${lang}.mdx`, root), 'utf8');
  bodies[lang] = content;
  const frontmatter = content.match(/^---\n([\s\S]+?)\n---\n/);
  assert.ok(frontmatter, `${lang}: frontmatter missing`);
  metadata[lang] = Object.fromEntries(
    [...frontmatter[1].matchAll(/^(\w+): ("[^"\n]+")$/gm)]
      .map((match) => [match[1], JSON.parse(match[2])]),
  );

  test(`${lang}: complete article with valid blog metadata`, () => {
    assert.equal(metadata[lang].title, titles[lang]);
    assert.equal(metadata[lang].publishedAt, '2026-10-01');
    assert.equal(metadata[lang].author, 'Livvux');
    assert.ok(metadata[lang].summary.length >= 100 && metadata[lang].summary.length <= 170);
    assert.ok(content.split(/\s+/).length >= 1400);
    assert.doesNotMatch(content, /^# /m, 'The blog route owns the single h1');
    assert.doesNotMatch(content, /<script|<iframe|dangerouslySetInnerHTML|cite|sandbox:|utm_source=/);
    assert.equal((content.match(/^```/gm) ?? []).length % 2, 0);
    assert.ok(content.endsWith('\n'));
  });

  test(`${lang}: primary sources and related article are linked`, () => {
    const targets = links(content);
    for (const source of requiredSources) assert.ok(targets.includes(source), source);
    assert.ok(targets.includes('/blog/cloudflare-cf-cli'));
    assert.ok(targets.includes('https://qbcore.net/'));
    for (const target of targets.filter((value) => !value.startsWith('/'))) {
      const url = new URL(target);
      assert.equal(url.protocol, 'https:');
      assert.equal(url.search, '');
      assert.ok(['blog.cloudflare.com', 'developers.cloudflare.com', 'dash.cloudflare.com',
        'github.com', 'qbcore.net'].includes(url.hostname));
    }
  });

  test(`${lang}: creation, indexing and querying remain separate documented steps`, () => {
    const shell = blocks(content, 'bash').join('\n');
    assert.match(shell, /npx wrangler ai-search create qbcore-docs \\\n  --type web-crawler \\\n  --source qbcore.net/);
    assert.match(shell, /npx wrangler ai-search stats qbcore-docs/);
    assert.match(shell, /npx wrangler ai-search search qbcore-docs/);
    assert.match(content, /same Cloudflare account|selben Cloudflare-Konto/);
    assert.ok(content.indexOf('**Create**') < content.indexOf('**Items**'));
    assert.match(content, /Playground/);
    assert.match(content, /Search\*\*.*Chat\*\*/);
    assert.doesNotMatch(shell, /\b(?:cf deploy|wrangler deploy|delete|destroy)\b/);
  });

  test(`${lang}: JSON, shell and Worker fragments parse without remote execution`, () => {
    for (const shell of blocks(content, 'bash')) {
      execFileSync('bash', ['-n'], { input: shell, timeout: 5000 });
      const payload = shell.match(/-d '([^']+)'/);
      if (payload) {
        const body = JSON.parse(payload[1]);
        assert.equal(body.messages[0].role, 'user');
        assert.equal(body.messages[0].content, 'How do I use qb-target?');
      }
    }
    const config = JSON.parse(blocks(content, 'json')[0]);
    assert.deepEqual(config.ai_search_namespaces, [
      { binding: 'AI_SEARCH', namespace: 'default', remote: true },
    ]);
    const worker = blocks(content, 'javascript')[0];
    assert.doesNotThrow(() => new AsyncFunction('env', worker));
    assert.match(worker, /env.AI_SEARCH.get\("qbcore-docs"\).search/);
    assert.match(worker, /results.chunks/);
    assert.match(content, /integration fragments|Integrationsfragmente/);
  });

  test(`${lang}: current APIs and public/private boundaries are explicit`, () => {
    assert.match(content, /PUBLIC_ENDPOINT_ID.search.ai.cloudflare.com\/search/);
    assert.match(content, /ai-search\/namespaces\/default\/instances\/qbcore-docs\/search/);
    assert.match(content, /AI Search:Edit/);
    assert.match(content, /AI Search:Run/);
    assert.match(content, /NEXT_PUBLIC_/);
    assert.match(content, /CORS is not authentication|CORS ist keine Authentifizierung/);
    assert.doesNotMatch(content, /env\.AI\.autorag|\/autorag\//);
  });

  test(`${lang}: GA date, billing, file limits and model qualifications are retained`, () => {
    assert.match(content, /October 1, 2026|1\. Oktober 2026/);
    assert.match(content, /November 1, 2026|1\. November 2026/);
    assert.match(content, /10 MiB/);
    assert.match(content, /4 MiB/);
    assert.match(content, /PDFs without OCR|PDFs ohne OCR/);
    assert.match(content, /indexing_options.use_ocr/);
    assert.match(content, /full reindex|vollständige Neuindexierung/);
    assert.match(content, /separate charges|separate Kosten/);
    assert.match(content, /shares the ingestion allowance|teilt sich die Freimenge/);
    assert.match(content, /new instances use hybrid search by default|Neue Instanzen verwenden standardmäßig die hybride Suche/i);
    assert.match(content, /@cf\/qwen\/qwen3-vl-embedding-2b/);
  });

  test(`${lang}: QBCore proposal is not presented as a deployed or benchmarked result`, () => {
    assert.match(content, /Ask QBCore/);
    assert.match(content, /proposed integration|vorgeschlagene Integration/);
    assert.match(content, /not an already-deployed feature|keine bereits veröffentlichte Funktion/);
    assert.match(content, /not a hands-on benchmark|kein eigener Praxistest/);
    assert.match(content, /No Cloudflare account was authenticated or modified|kein Cloudflare-Konto authentifiziert oder verändert/);
    assert.match(content, /existing documentation search|bestehenden Dokumentationssuche/);
  });
}

test('translations preserve source links, executable examples and section structure', () => {
  assert.deepEqual([...new Set(links(bodies.en))].sort(), [...new Set(links(bodies.de))].sort());
  for (const language of ['bash', 'json', 'javascript']) {
    assert.deepEqual(blocks(bodies.en, language), blocks(bodies.de, language));
  }
  const headings = (text) => [...text.matchAll(/^(#{2,3}) /gm)].map((match) => match[1]);
  assert.deepEqual(headings(bodies.en), headings(bodies.de));
});

test('prices and allowances agree across translations', () => {
  for (const expected of ['5 million tokens', '10 GB-month', '$0.75 / million tokens',
    '$2.00 / GB-month', '$0.75 / 1,000 queries', '$0.10 / 1,000 queries', '$0.50']) {
    assert.ok(bodies.en.includes(expected), expected);
  }
  for (const expected of ['5 Millionen Tokens', '10 GB-Monate', '0,75 USD / Million Tokens',
    '2,00 USD / GB-Monat', '0,75 USD / 1.000 Anfragen', '0,10 USD / 1.000 Anfragen', '0,50 USD']) {
    assert.ok(bodies.de.includes(expected), expected);
  }
});

// Only run these against the real built Next.js application, never mocked HTML.
if (process.env.ARTICLE_BASE_URL) {
  const base = new URL(process.env.ARTICLE_BASE_URL);
  assert.ok(['localhost', '127.0.0.1'].includes(base.hostname));
  for (const lang of ['en', 'de']) {
    test(`${lang}: production route renders metadata, translations and code blocks`, async () => {
      const path = `/blog/${slug}${lang === 'de' ? '/de' : ''}`;
      const response = await fetch(new URL(path, base), { signal: AbortSignal.timeout(30_000) });
      assert.equal(response.status, 200);
      const html = await response.text();
      assert.equal((html.match(/<h1\b/g) ?? []).length, 1);
      assert.ok(html.includes(titles[lang]));
      assert.ok(html.includes(metadata[lang].summary));
      assert.ok(html.includes(`rel="canonical" href="https://livvux.dev${path}"`));
      assert.ok(html.includes(`/blog/${slug}/de`));
      assert.ok(html.includes(`/blog/${slug}`));
      assert.ok(html.includes('/blog/cloudflare-cf-cli'));
      assert.ok(html.includes('https://blog.cloudflare.com/ai-search-ga/'));
      assert.ok(html.includes('<pre'));
      assert.ok(html.includes('<table'));
      assert.ok(html.includes('Copy code'));
    });
  }
}
