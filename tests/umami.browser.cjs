// Run against a local fixture-ID build; every public-looking URL is intercepted.
// UMAMI_FIXTURE_SCRIPT must contain the reviewed, real self-hosted Umami script.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const local = new URL(process.env.TEST_BASE_URL || 'http://127.0.0.1:3137');
assert.ok(['127.0.0.1', 'localhost'].includes(local.hostname), 'Local server only');
const scriptUrl = 'https://rpcrate.com/_sr/s.js';
const collectUrl = 'https://rpcrate.com/_sr/api/send';
const id = 'a1111111-1111-4111-8111-111111111111';

async function run() {
  assert.ok(process.env.UMAMI_FIXTURE_SCRIPT, 'Supply the real offline Umami script fixture');
  const tracker = await fs.readFile(process.env.UMAMI_FIXTURE_SCRIPT, 'utf8');
  const browser = await chromium.launch({ headless: true });
  const checks = [];
  async function fixture(path = '/', privacy, hostname = 'livvux.dev') {
    const context = await browser.newContext({ serviceWorkers: 'block' });
    if (privacy) await context.addInitScript((signal) => {
      Object.defineProperty(navigator, signal === 'DNT' ? 'doNotTrack' : 'globalPrivacyControl', {
        value: signal === 'DNT' ? '1' : true, configurable: true,
      });
    }, privacy);
    const page = await context.newPage(), posts = [], errors = [];
    let loads = 0, scriptReferrer;
    page.on('pageerror', (error) => errors.push(error.message));
    await context.route('**/*', async (route) => {
      const request = route.request(), url = new URL(request.url());
      if (request.url() === scriptUrl) {
        loads++; scriptReferrer = request.headers().referer;
        await route.fulfill({ contentType: 'text/javascript', body: tracker });
      } else if (request.url() === collectUrl) {
        if (request.method() === 'POST') posts.push(request.postDataJSON());
        await route.fulfill({ contentType: 'application/json', body: '{}', headers: {
          'access-control-allow-origin': `https://${hostname}`,
          'access-control-allow-headers': 'content-type,x-umami-hostname,x-umami-website-id',
        } });
      } else if (url.hostname === hostname) {
        // Forward only to the loopback Next server, including real RSC requests.
        const response = await route.fetch({ url: new URL(url.pathname + url.search, local).href, maxRedirects: 0 });
        await route.fulfill({ response });
      } else await route.abort();
    });
    await page.goto(`https://${hostname}${path}`, { referer: 'https://source.example/?email=PRIVATE_REFERRER#PRIVATE' });
    await page.waitForFunction(() => document.readyState === 'complete');
    await page.waitForTimeout(350);
    return { page, context, posts, errors, loads: () => loads, scriptReferrer: () => scriptReferrer };
  }
  async function count(f, expected) {
    for (let i = 0; i < 30 && f.posts.length !== expected; i++) await f.page.waitForTimeout(100);
    assert.equal(f.posts.length, expected);
    await f.page.waitForTimeout(350); // catches delayed automatic pageviews
    assert.equal(f.posts.length, expected);
  }
  try {
    const f = await fixture('/?q=PRIVATE_SEARCH#PRIVATE_FRAGMENT');
    await count(f, 1);
    assert.equal(f.loads(), 1); assert.equal(f.scriptReferrer(), undefined);
    assert.deepEqual(f.posts[0], { type: 'event', payload: {
      website: id, hostname: 'livvux.dev', url: '/',
      title: 'Lucas Kleipoedszus | Freelance Software Developer', referrer: '',
    } });
    const flags = await f.page.locator('#livvux-dev-umami-script').evaluate((script) => ({
      auto: script.dataset.autoTrack, search: script.dataset.excludeSearch,
      hash: script.dataset.excludeHash, credentials: script.dataset.fetchCredentials,
    }));
    assert.deepEqual(flags, { auto: 'false', search: 'true', hash: 'true', credentials: 'omit' });
    await f.page.evaluate(() => { window.fixtureSpaMarker = 'same-document'; });
    await f.page.getByRole('link', { name: 'Browse all articles', exact: true }).click();
    await f.page.waitForURL('**/blog'); await count(f, 2);
    assert.equal(await f.page.evaluate(() => window.fixtureSpaMarker), 'same-document');
    await f.page.getByRole('link', { name: 'Page 2', exact: true }).click();
    await f.page.waitForURL('**/blog?page=2'); await count(f, 3);
    await f.page.locator('#blog li article h2 a').first().click();
    await f.page.waitForURL(/\/blog\/[^/?]+$/); await count(f, 4);
    assert.equal(await f.page.evaluate(() => window.fixtureSpaMarker), 'same-document');
    assert.equal(f.loads(), 1);
    assert.deepEqual(f.posts.map((entry) => entry.payload.url).slice(0, 3), ['/', '/blog', '/blog']);
    assert.equal(f.posts[3].payload.url, new URL(f.page.url()).pathname);
    assert.ok(f.posts.every((entry) => entry.type === 'event' && Object.keys(entry.payload).sort().join(',') === 'hostname,referrer,title,url,website'));
    assert.ok(!JSON.stringify(f.posts).includes('PRIVATE'));
    assert.ok(f.posts.every((entry) => entry.payload.referrer === '' && !entry.payload.url.includes('?') && !entry.payload.url.includes('#')));
    assert.deepEqual(f.errors, []);
    checks.push('one initial pageview; genuine Next Link SPA archive, pagination and article; one script; sanitized payload');
    await f.context.close();

    for (const [path, privacy] of [
      ['/?token=PRIVATE_TOKEN'], ['/#email=PRIVATE_EMAIL'], ['/tools'], ['/tools/internal-links?key=PRIVATE_KEY'],
      ['/privacy'], ['/blog/missing-article-private'], ['/', 'DNT'], ['/', 'GPC'],
    ]) {
      const gated = await fixture(path, privacy);
      assert.equal(gated.loads(), 0, `${path} ${privacy || ''} must not load analytics`);
      assert.deepEqual(gated.posts, []);
      checks.push(`before-script exclusion: ${path} ${privacy || ''}`);
      await gated.context.close();
    }
    const alias = await fixture('/', undefined, 'www.livvux.dev');
    await count(alias, 1); assert.equal(alias.posts[0].payload.hostname, 'www.livvux.dev');
    await alias.context.close(); checks.push('explicit own-domain www host gate (live alias state unverified)');
    const result = { status: 'passed', mode: 'loopback Next 16.1.1 fixture build; intercepted real Umami 3.4.0 script/collect; no public network', timestamp: new Date().toISOString(), checks };
    if (process.env.UMAMI_TEST_RESULT) await fs.writeFile(process.env.UMAMI_TEST_RESULT, JSON.stringify(result, null, 2));
    console.log(JSON.stringify(result, null, 2));
  } finally { await browser.close(); }
}
run().catch((error) => { console.error(error); process.exitCode = 1; });
