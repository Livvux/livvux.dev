import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const slug = 'claude-opus-5-5';
const read = (path) => readFileSync(new URL(path, root), 'utf8');
const sourceUrls = [
  'https://www.anthropic.com/claude-opus-5-5',
  'https://artificialanalysis.ai/models/releases/claude-opus-5-5',
  'https://artificialanalysis.ai/articles/claude-opus-5-5',
  'https://platform.claude.com/docs/en/models/opus-5-5/overview',
  'https://platform.claude.com/docs/en/about-claude/pricing',
  'https://platform.claude.com/docs/en/models/opus-5-5/migration-guide',
  'https://artificialanalysis.ai/methodology/intelligence-benchmarking',
];
const charts = [
  ['7fd5f0b59acb7f47a13db71f4e07a06763d9186a-2008x2005.png', 2008, 2005],
  ['77c818c26ed8d618c0cdd3cd54b8a12194cbf883-2008x1176.png', 2008, 1176],
].map(([file, width, height]) => ({
  original: `https://cdn.sanity.io/images/6vfeftx9/articles/${file}`,
  width,
  height,
}));
const expectedRows = [
  ['low', 42, 0.55], ['medium', 51, 1.34], ['high', 54, 1.82],
  ['xhigh', 56, 3.46], ['max', 58, 5.98],
];

function effortRows(content) {
  return [...content.matchAll(/^\| (low|medium|high|xhigh|max) \| (\d+) \| \$([\d.,]+) \|$/gm)]
    .map(([, effort, score, cost]) => [effort, Number(score), Number(cost.replace(',', '.'))]);
}

for (const lang of ['en', 'de']) {
  const content = read(`content/${slug}/${lang}.mdx`);

  test(`${lang}: complete frontmatter and safe MDX`, () => {
    const frontmatter = content.match(/^---\n([\s\S]+?)\n---\n/);
    assert.ok(frontmatter);
    for (const key of ['title', 'publishedAt', 'author', 'summary']) {
      assert.match(frontmatter[1], new RegExp(`^${key}: "[^"\\n]+"$`, 'm'));
    }
    assert.match(frontmatter[1], /^publishedAt: "2026-09-24"$/m);
    assert.match(frontmatter[1], /^author: "Livvux"$/m);
    assert.doesNotMatch(frontmatter[1], /^image:/m, 'Use the existing generated OG image');
    assert.doesNotMatch(content, /^# /m, 'The page already renders the h1');
    assert.equal((content.match(/^## /gm) ?? []).length, 7);
    assert.doesNotMatch(content, /<script|<iframe|dangerouslySetInnerHTML|sandbox:||utm_source/);
  });

  test(`${lang}: source links and benchmark snapshot`, () => {
    for (const url of sourceUrls) assert.ok(content.includes(url), url);
    assert.deepEqual(effortRows(content), expectedRows);
    assert.match(content, /default fallback|Standard-Fallback/);
    assert.match(content, /not prices per million tokens|nicht pro Million Tokens/);
    assert.match(content, /4\.3\.2/);
    assert.match(content, /September 24, 2026|24\. September 2026/);
  });

  test(`${lang}: original attributed charts, not simulated graphics`, () => {
    const figures = [...content.matchAll(/<figure>([\s\S]+?)<\/figure>/g)];
    assert.equal(figures.length, charts.length);
    figures.forEach(([, figure], index) => {
      const { original, width, height } = charts[index];
      assert.ok(figure.includes(`href="${original}"`));
      assert.ok(figure.includes(`src="${original}?auto=format&w=1200"`));
      assert.ok(figure.includes(`width="${width}" height="${height}"`));
      assert.match(figure, /alt="[^"]{70,}"/);
      assert.match(figure, /aria-label="[^"]{40,}"/);
      assert.match(figure, /loading="lazy" decoding="async" referrerPolicy="no-referrer"/);
      assert.match(figure, /rel="noopener noreferrer"/);
      assert.match(figure, /width: "100%", height: "auto"/);
      assert.match(figure, /<figcaption>[\s\S]*Artificial Analysis[\s\S]*<\/figcaption>/);
      assert.ok(figure.includes(sourceUrls[2]));
    });
    assert.match(content, /not recreated graphics or live embeds|weder nachgezeichnete Grafiken noch Live-Einbettungen/);
  });

  test(`${lang}: publication keeps cost and evaluation caveats`, () => {
    assert.match(content, /not a hands-on benchmark|kein eigener Praxistest/);
    assert.match(content, /119[,.]000/);
    assert.match(content, /73[,.]000/);
    assert.match(content, /approximately level|ungefähr gleichauf/);
    assert.match(content, /not a guaranteed saving|keine garantierte Ersparnis/);
    assert.match(content, /default settings|Standardeinstellungen/);
    assert.match(content, /visible answer length|sichtbare Antwortlänge/);
    assert.match(content, /max_tokens/);
    assert.match(content, /cost per accepted change|Kosten pro abgenommener Änderung/i);
  });
}

test('translations use the same figures, sources and numerical snapshot', () => {
  const en = read(`content/${slug}/en.mdx`);
  const de = read(`content/${slug}/de.mdx`);
  assert.deepEqual(effortRows(en), effortRows(de));
  const images = (text) => [...text.matchAll(/<img src="([^"]+)"/g)].map((match) => match[1]);
  assert.deepEqual(images(en), images(de));
});

test('source notes document publisher ownership and snapshot limitations', () => {
  const notes = read('docs/claude-opus-5-5-article-sources.md');
  for (const url of sourceUrls) assert.ok(notes.includes(url));
  for (const chart of charts) assert.ok(notes.includes(chart.original));
  assert.match(notes, /not covered by this repository's MIT license/);
  assert.match(notes, /not a live dashboard embed/);
  assert.match(notes, /not a hands-on model evaluation/);
});

// Opt-in checks use the actual built site; the local content tests need no network.
if (process.env.ARTICLE_BASE_URL) {
  const base = new URL(process.env.ARTICLE_BASE_URL);
  assert.ok(['http:', 'https:'].includes(base.protocol));
  for (const lang of ['en', 'de']) {
    test(`${lang}: production route, metadata, translation link and figures`, async () => {
      const path = `/blog/${slug}${lang === 'de' ? '/de' : ''}`;
      const translation = `/blog/${slug}${lang === 'en' ? '/de' : ''}`;
      const response = await fetch(new URL(path, base), { signal: AbortSignal.timeout(30000) });
      assert.equal(response.status, 200);
      const html = await response.text();
      const title = read(`content/${slug}/${lang}.mdx`).match(/^title: "([^"]+)"$/m)[1];
      assert.ok(html.includes(title));
      assert.equal((html.match(/<h1\b/g) ?? []).length, 1);
      assert.ok(html.includes(`href="${translation}"`));
      assert.ok(html.includes(`href="https://livvux.dev${path}"`));
      assert.ok(html.includes(`"inLanguage":"${lang}"`));
      const article = html.match(/<article\b[^>]*>([\s\S]+?)<\/article>/)?.[1];
      assert.ok(article);
      assert.equal((article.match(/<figure>/g) ?? []).length, 2);
      assert.equal((article.match(/<img\b/g) ?? []).length, 2);
      assert.equal((article.match(/<table\b/g) ?? []).length, 2);
      for (const chart of charts) assert.ok(article.includes(chart.original));
    });
  }
}

// Availability is tested separately because the original chart CDN is a third party.
if (process.env.ARTICLE_CHECK_REMOTE_IMAGES === '1') {
  for (const chart of charts) {
    test(`publisher chart is a real image: ${chart.original}`, async () => {
      const response = await fetch(`${chart.original}?auto=format&w=1200`, {
        signal: AbortSignal.timeout(30000),
        headers: { Accept: 'image/png' },
      });
      assert.equal(response.status, 200);
      assert.match(response.headers.get('content-type') ?? '', /^image\//);
      const bytes = Buffer.from(await response.arrayBuffer());
      assert.ok(bytes.length > 10000, 'Reject error documents or placeholder pixels');
      assert.ok(bytes.length < 10000000, 'Avoid unexpectedly large assets');
      const isPng = bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
      const isJpeg = bytes[0] === 255 && bytes[1] === 216;
      const isWebp = bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP';
      assert.ok(isPng || isJpeg || isWebp, 'Validate raster image signature');
      if (isPng) {
        const width = bytes.readUInt32BE(16);
        const height = bytes.readUInt32BE(20);
        assert.ok(width >= 1000);
        assert.ok(Math.abs(height / width - chart.height / chart.width) < 0.01);
      }
    });
  }
}
