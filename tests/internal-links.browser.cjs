// Run against `pnpm start`. The browser uses the real React page, but never a paid API key.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const base = process.env.TEST_BASE_URL || 'http://localhost:3000';
const dir = 'test-results/internal-links';
const usage = { requests: 3, inputTokens: 1000, outputTokens: 30, cost: 0.000042, model: 'jev-1.13.0', estimated: true };
const row = (path) => ({ url: `https://example.com/${path}`, title: `Piano ${path}`, type: 'support_article', intent: 'informational', language: 'en', wordCount: 420, incoming: 1, incomingContextual: 0, outgoing: 1, suggestedIn: 1, suggestedOut: 1, noindex: false, truncated: false });
const suggestion = { source: 'https://example.com/tuning', target: 'https://example.com/maintenance', anchor: 'piano maintenance', anchorStart: 8, sentence: 'Regular piano maintenance improves tuning stability.', role: 'deeper_detail', probability: 0.91, placementConfidence: 0.85 };
const link = { source: suggestion.target, target: suggestion.source, anchor: 'read more', contextual: true, nofollow: false };
const report = { site: 'https://example.com/', generatedAt: '2026-09-23T08:00:00Z', partial: false, coverage: { discovered: 2, attempted: 2, fetched: 2, canonicalPages: 2, linksJudged: 1, sitemapFiles: 1, downloadBudgetUsedBytes: 3000, maxPages: 500, javascriptRendered: false }, usage, pages: [row('tuning'), row('maintenance')], links: [link], suggestions: [suggestion], weakPages: [{ ...row('maintenance'), sources: [suggestion.source] }], genericAnchors: [link], skipped: [], warnings: [] };
const events = [
  { event: 'stage', stage: 'fetch', message: 'Fetching fixture pages.' },
  { event: 'page', url: suggestion.source, title: 'Piano tuning', pages: 2 },
  { event: 'class', url: suggestion.source, pageType: 'support_article', intent: 'informational', classified: 2, tally: { support_article: 2 } },
  { event: 'usage', usage }, { event: 'link', ...suggestion, accepted: true, judged: 1, found: 1 },
  { event: 'stage', stage: 'report', message: 'Preparing fixture report.' }, { event: 'report', report },
];
(async () => {
  await fs.mkdir(dir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
  const errors = []; page.on('pageerror', (error) => errors.push(error.message));
  let submitted = false;
  await page.route('**/api/tools/internal-links', async (route) => {
    const body = route.request().postDataJSON(); assert.equal(body.key, 'ts_browser_fixture_only'); assert.equal(body.url, 'https://example.com/'); submitted = true;
    assert.ok(!route.request().url().includes('ts_'));
    await route.fulfill({ status: 200, contentType: 'application/x-ndjson', body: events.map((event) => JSON.stringify(event)).join('\n') + '\n' });
  });
  try {
    await page.goto(`${base}/tools/internal-links`);
    await page.getByRole('heading', { name: 'Internal links tool', exact: true }).waitFor();
    assert.equal(await page.locator('button').filter({ hasText: /pay|checkout|\$1/i }).count(), 0);
    assert.equal(await page.locator('#audit-key').getAttribute('type'), 'password');
    await page.screenshot({ path: `${dir}/desktop-form.png`, fullPage: false });
    await page.locator('#audit-site').fill('https://example.com/');
    await page.locator('#audit-key').fill('ts_browser_fixture_only');
    await page.getByRole('button', { name: 'Analyse internal links', exact: true }).click();
    await page.getByRole('heading', { name: 'Your internal link report' }).waitFor();
    assert.ok(submitted); assert.equal(await page.locator('#audit-key').inputValue(), '');
    await page.getByRole('button', { name: /Recommended links/ }).click();
    assert.equal(await page.locator('mark').textContent(), 'piano maintenance');
    await page.getByLabel('Filter report').fill('does-not-exist');
    await page.getByText('No matching results.', { exact: true }).waitFor();
    await page.getByLabel('Filter report').fill('');
    for (const tab of ['Pages', 'Generic anchors', 'Existing links', 'Link map']) await page.getByRole('button', { name: new RegExp(`^${tab}`) }).click();
    const downloaded = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download JSON', exact: true }).click();
    const json = await downloaded; const target = `${dir}/report.json`; await json.saveAs(target);
    assert.equal(JSON.parse(await fs.readFile(target, 'utf8')).suggestions[0].anchor, suggestion.anchor);
    const csvWait = page.waitForEvent('download'); await page.getByRole('button', { name: 'Download CSV', exact: true }).click();
    const csv = await csvWait; await csv.saveAs(`${dir}/report.csv`);
    assert.ok((await fs.readFile(`${dir}/report.csv`, 'utf8')).includes('"suggestion"'));
    assert.equal(await page.evaluate(() => JSON.stringify({ ...localStorage, ...sessionStorage }).includes('ts_browser_fixture_only')), false);
    await page.screenshot({ path: `${dir}/desktop-report.png`, fullPage: false });
    await page.setViewportSize({ width: 390, height: 844 });
    const dock = page.locator('div.fixed').filter({ has: page.getByRole('link', { name: 'Tools', exact: true }) });
    const bounds = await dock.locator(':scope > div').boundingBox();
    assert.ok(bounds && bounds.x >= 0 && bounds.x + bounds.width <= 391, 'Navigation must fit the mobile viewport.');
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'Mobile page must not overflow horizontally.');
    await page.screenshot({ path: `${dir}/mobile-report.png`, fullPage: false });
    await page.reload();
    await page.getByRole('heading', { name: 'Internal links tool', exact: true }).waitFor();
    await page.screenshot({ path: `${dir}/mobile-form.png`, fullPage: false });
    await page.unroute('**/api/tools/internal-links');
    await page.route('**/api/tools/internal-links', (route) => route.fulfill({ status: 200, contentType: 'application/x-ndjson', body: JSON.stringify({ event: 'error', message: 'TypeSafe rejected this API key.' }) + '\n' }));
    await page.locator('#audit-site').fill('https://example.com/'); await page.locator('#audit-key').fill('ts_browser_fixture_only');
    await page.getByRole('button', { name: 'Analyse internal links', exact: true }).click();
    await page.getByRole('alert').filter({ hasText: 'TypeSafe rejected this API key.' }).waitFor();
    assert.equal(await page.getByRole('heading', { name: 'Your internal link report' }).count(), 0);
    assert.deepEqual(errors, []);
    await fs.writeFile(`${dir}/checks.json`, JSON.stringify({ status: 'passed', provider: 'intercepted fixture, no paid API call', checks: ['desktop render', 'required password key', 'no checkout', 'form POST', 'report tabs', 'anchor highlighting', 'search', 'CSV', 'JSON', 'no key storage', 'mobile overflow', 'error state', 'no React page errors'] }, null, 2));
  } finally { await browser.close(); }
})().catch((error) => { console.error(error); process.exitCode = 1; });
