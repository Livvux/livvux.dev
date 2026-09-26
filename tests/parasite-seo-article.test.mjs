import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const slug = 'parasite-seo-explained';
const imagePath = '/images/blog/parasite-seo/search-results.webp';
const read = (path) => readFileSync(new URL(path, root), 'utf8');
const image = readFileSync(new URL(`public${imagePath}`, root));
const imageHash = '493a14633714b667346f51f96d1fa0b772613e3ae3592a24af33ff48c7caa6db';
const titles = {
  en: 'Parasite SEO: Getting Found on Google Through Other Websites',
  de: 'Parasite SEO: Mit fremden Websites bei Google gefunden werden',
};
const requiredSources = [
  'https://x.com/hridoyreh/status/2103058232218619936/video/1',
  'https://developers.google.com/search/docs/essentials/spam-policies',
  'https://developers.google.com/search/blog/2026/08/update-site-reputation-policy',
  'https://developers.google.com/search/docs/appearance/ranking-systems-guide',
  'https://developers.google.com/search/docs/fundamentals/how-search-works',
  'https://support.google.com/sites/answer/6372880?hl=en',
  'https://support.google.com/docs/answer/183965?hl=en',
  'https://developer.chrome.com/docs/webstore/register',
  'https://support.google.com/communities/answer/7425194?hl=en',
  'https://help.medium.com/hc/en-us/articles/213477928-Medium-Rules',
];
const bodies = {};

for (const lang of ['en', 'de']) {
  const content = read(`content/${slug}/${lang}.mdx`);
  bodies[lang] = content;

  test(`${lang}: repository frontmatter and one page-level title`, () => {
    const match = content.match(/^---\n([\s\S]+?)\n---\n/);
    assert.ok(match, 'MDX frontmatter is required');
    const metadata = Object.fromEntries([...match[1].matchAll(/^(\w+): "([^"\n]+)"$/gm)].map((m) => [m[1], m[2]]));
    assert.equal(metadata.title, titles[lang]);
    assert.equal(metadata.publishedAt, '2026-09-26');
    assert.equal(metadata.author, 'Livvux');
    assert.ok(metadata.summary.length > 80);
    assert.ok(content.split(/\s+/).length > 1000, 'Keep the complete article, not a placeholder');
    assert.doesNotMatch(content, /^# /m, 'The route already renders the h1');
    assert.doesNotMatch(content, /<script|<iframe|dangerouslySetInnerHTML|cite|turn\d+view|sandbox:/);
  });

  test(`${lang}: primary sources and original X reference remain linked`, () => {
    const links = [...content.matchAll(/\]\((https:\/\/[^)]+)\)/g)].map((m) => m[1]);
    for (const source of requiredSources) assert.ok(links.includes(source), source);
    assert.ok(links.length >= 14);
    for (const link of links) assert.equal(new URL(link).protocol, 'https:');
  });

  test(`${lang}: real local screenshot is accessible and attributed`, () => {
    const images = [...content.matchAll(/<img\b[^>]*\/>/g)];
    assert.equal(images.length, 1);
    assert.ok(images[0][0].includes(`src="${imagePath}"`));
    assert.match(images[0][0], /alt="[^"]{40,}"/);
    assert.match(images[0][0], /width="680" height="394"/);
    assert.match(images[0][0], /loading="lazy" decoding="async"/);
    assert.match(content, /<figcaption>[^<]*@hridoyreh[^<]*<\/figcaption>/);
    assert.equal((content.match(/<figure>/g) ?? []).length, 1);
    assert.equal((content.match(/<\/figure>/g) ?? []).length, 1);
    assert.doesNotMatch(content, /\]\(images\//, 'Standalone Markdown image paths must be migrated');
  });

  test(`${lang}: ranking and income examples retain their limitations`, () => {
    assert.match(content, /not an independently verified current ranking|keine unabhängig überprüfte aktuelle Platzierung/);
    assert.match(content, /hypothetical example|hypothetisches Beispiel/);
    assert.match(content, /\$100 before costs|100 Dollar vor Kosten/);
    assert.match(content, /not a conversion benchmark|keine üblichen Conversion-Werte/);
    assert.match(content, /video could not be reviewed in full|Video war nicht vollständig abrufbar/);
    assert.match(content, /searcher's location|Standort der suchenden Person/);
    assert.match(content, /August 28, 2026|28\. August 2026/);
    assert.match(content, /I would not recommend that|Das würde ich nicht empfehlen/);
  });
}

test('translations cover the same article structure', () => {
  const levels = (text) => [...text.matchAll(/^(#{2,3}) /gm)].map((m) => m[1]);
  assert.deepEqual(levels(bodies.en), levels(bodies.de));
});

test('screenshot is the reviewed WebP, not a placeholder', () => {
  assert.equal(image.toString('ascii', 0, 4), 'RIFF');
  assert.equal(image.toString('ascii', 8, 12), 'WEBP');
  assert.equal(image.length, 19862);
  assert.equal(createHash('sha256').update(image).digest('hex'), imageHash);
});

test('source notes preserve provenance and verification limitations', () => {
  const notes = read('docs/parasite-seo-article-sources.md');
  assert.ok(notes.includes(imageHash));
  assert.match(notes, /680.*394/);
  assert.match(notes, /No generated images/);
  assert.match(notes, /not independently verified/);
});

// Optional integration checks use the actual production server built by CI.
if (process.env.ARTICLE_BASE_URL) {
  const base = new URL(process.env.ARTICLE_BASE_URL);
  assert.ok(['localhost', '127.0.0.1'].includes(base.hostname), 'Use a local test server');
  for (const lang of ['en', 'de']) {
    test(`${lang}: production route, metadata, translation and screenshot render`, async () => {
      const path = `/blog/${slug}${lang === 'de' ? '/de' : ''}`;
      const response = await fetch(new URL(path, base), { signal: AbortSignal.timeout(30_000) });
      assert.equal(response.status, 200);
      const html = await response.text();
      assert.equal((html.match(/<h1\b/g) ?? []).length, 1);
      assert.ok(html.includes(titles[lang]));
      assert.ok(html.includes('rel="canonical"'));
      assert.ok(html.includes(`/blog/${slug}/de`));
      assert.ok(html.includes(`/blog/${slug}`));
      assert.ok(html.includes(imagePath));
      const xLink = html.match(/<a\b[^>]*href="https:\/\/x\.com\/hridoyreh\/status\/2103058232218619936\/video\/1"[^>]*>/);
      assert.ok(xLink, 'Original source link is rendered');
      assert.match(xLink[0], /target="_blank"/);
      assert.match(xLink[0], /rel="[^"]*noopener/);
      assert.match(xLink[0], /rel="[^"]*noreferrer/);
    });
  }
  test('production image endpoint serves the exact reviewed asset', async () => {
    const response = await fetch(new URL(imagePath, base), { signal: AbortSignal.timeout(10_000) });
    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type') ?? '', /image\/webp/);
    assert.deepEqual(Buffer.from(await response.arrayBuffer()), image);
  });
}
