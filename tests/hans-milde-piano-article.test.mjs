import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const slug = 'hans-milde-piano-tuning-check';
const sourceSha = '2acf421b49c87a0b9a0e1bf5f9ba5278d6260260';
const read = (path) => readFileSync(new URL(path, root), 'utf8');
const notes = ['C4', 'D4', 'E4', 'G4', 'A4', 'C5'];
const offset = 1200 * Math.log2(432 / 440);
const residuals = [0, 0, -18, 0, 18, 0];
const sourceHosts = new Set([
  'klavierbau-milde.de', 'github.com', 'developer.mozilla.org',
  'pubs.aip.org', 'muted.io', 'pianometer.com',
]);

for (const lang of ['en', 'de']) {
  const content = read(`content/${slug}/${lang}.mdx`);
  const asset = `/images/blog/hans-milde-piano-tuning/pitch-pattern-${lang}.svg`;
  const svg = read(`public${asset}`);

  test(`${lang}: repository frontmatter, one page title and safe MDX structure`, () => {
    const match = content.match(/^---\n([\s\S]+?)\n---\n/);
    assert.ok(match);
    for (const key of ['title', 'publishedAt', 'author', 'summary']) {
      assert.match(match[1], new RegExp(`^${key}: "[^"\\n]+"$`, 'm'));
    }
    assert.match(match[1], /^publishedAt: "2026-09-24"$/m);
    assert.match(match[1], /^author: "Livvux"$/m);
    assert.doesNotMatch(content, /^# /m, 'The existing page renders the h1');
    assert.equal((content.match(/^```/gm) ?? []).length, 4);
    assert.equal((content.match(/^## /gm) ?? []).length, 9);
    assert.doesNotMatch(content, /<script|<iframe|dangerouslySetInnerHTML|sandbox:||utm_source/);
    assert.doesNotMatch(content, /\]\(assets\//);
  });

  test(`${lang}: every footnote resolves to a stable, allowed source`, () => {
    const definitions = [...content.matchAll(/^\[\^([^\]]+)\]: (.+)$/gm)];
    const ids = definitions.map((match) => match[1]);
    assert.equal(ids.length, new Set(ids).size);
    const body = content.replace(/^\[\^[^\]]+\]: .+$/gm, '');
    const references = new Set([...body.matchAll(/\[\^([^\]]+)\]/g)].map((m) => m[1]));
    assert.deepEqual([...references].sort(), [...ids].sort());
    const urls = [...content.matchAll(/\]\((https:\/\/[^)]+)\)/g)].map((m) => new URL(m[1]));
    assert.ok(urls.length >= 15);
    for (const url of urls) {
      assert.ok(sourceHosts.has(url.hostname), url.href);
      if (url.hostname === 'github.com' && url.pathname.includes('/blob/')) {
        assert.ok(url.pathname.includes(`/blob/${sourceSha}/`), 'Pin implementation references');
      }
    }
    assert.ok(urls.some((url) => url.href === 'https://klavierbau-milde.de/klavier-stimmung-test'));
    assert.ok(urls.some((url) => url.pathname.endsWith('/pull/19')));
    assert.match(content, /Access to the client repository may be required|Zugriffsberechtigung nötig/);
  });

  test(`${lang}: AI, screening and synthetic-test limits remain explicit`, () => {
    assert.match(content, /no language model judging|Kein Sprachmodell beurteilt/);
    assert.match(content, /all six distinct notes|alle sechs unterschiedlichen Töne/);
    assert.match(content, /200 milliseconds|200 Millisekunden/);
    assert.match(content, /550 milliseconds|550 Millisekunden/);
    assert.match(content, /486 synthetic accuracy cases|486 synthetische Genauigkeitsfälle/);
    assert.match(content, /not a guarantee of one-cent accuracy|keine Garantie für eine Genauigkeit von einem Cent/);
    assert.match(content, /real instruments, physical devices|echten Instrumenten, physischen Geräten/);
    assert.match(content, /No audio recording is attached|Eine Audioaufnahme wird nicht angehängt/);
    assert.match(content, /YIN.*2002|YIN wurde 2002/);
    assert.doesNotMatch(content, /world.?s first|weltweit einzigartig|99\.9% accurate/i);
  });

  test(`${lang}: localized vector figure has dimensions, captions and a text table`, () => {
    const images = [...content.matchAll(/<img\b[^>]*\/>/g)];
    assert.equal(images.length, 1);
    assert.ok(images[0][0].includes(`src="${asset}"`));
    assert.match(images[0][0], /alt="[^"]{50,}"/);
    assert.match(images[0][0], /width="960" height="580"/);
    assert.match(images[0][0], /loading="lazy" decoding="async"/);
    assert.equal((content.match(/<figure>/g) ?? []).length, 1);
    assert.match(content, /<figcaption>[^<]+<\/figcaption>/);
    assert.match(content, /not recordings or validation data|keine Aufnahmen oder Validierungsdaten/);
    const rows = [...content.matchAll(/^\| (C4|D4|E4|G4|A4|C5) \| ([\d.,-]+) \| ([\d.,-]+) \|$/gm)];
    assert.deepEqual(rows.map((row) => row[1]), notes);
    rows.forEach((row, index) => {
      assert.equal(Number(row[2].replace(',', '.')), Number(offset.toFixed(2)));
      assert.equal(Number(row[3].replace(',', '.')), Number((offset + residuals[index]).toFixed(2)));
    });
    assert.match(svg, /role="img" aria-labelledby="title desc"/);
    assert.ok(svg.includes(`xml:lang="${lang}"`));
    assert.match(svg, /<title id="title">[^<]+<\/title>/);
    assert.match(svg, /<desc id="desc">[^<]+<\/desc>/);
    assert.doesNotMatch(svg, /<script|<image|<foreignObject|href=|onload=/i);
  });

  test(`${lang}: both chart traces reproduce the calculated values`, () => {
    for (const name of ['uniform', 'uneven']) {
      const match = svg.match(new RegExp(`<polyline data-series="${name}" points="([^"]+)"`));
      assert.ok(match);
      const points = match[1].split(' ').map((pair) => pair.split(',').map(Number));
      assert.equal(points.length, 6);
      for (const [index, [x, y]] of points.entries()) {
        assert.equal(x, 104 + index * 144);
        const value = offset + (name === 'uneven' ? residuals[index] : 0);
        const expectedY = 178 + (10 - value) * 4.5;
        assert.ok(Math.abs(y - expectedY) <= 0.0051, `${name}: ${notes[index]}`);
      }
    }
    assert.match(svg, /stroke-dasharray="8 6"/);
  });
}

test('article source notes distinguish illustration, software tests and field validation', () => {
  const documentation = read('docs/hans-milde-piano-article-sources.md').replace(/\s+/g, ' ');
  assert.ok(documentation.includes(sourceSha));
  assert.match(documentation, /6 × 9 × 3 × 3 = 486/);
  assert.match(documentation, /not real piano recordings/);
  assert.match(documentation, /No physical piano or microphone was tested/);
  assert.match(documentation, /Neither source code nor algorithms are claimed to be unique/);
});

// Opt-in integration tests target the real local production build, never a mock HTML fixture.
if (process.env.ARTICLE_BASE_URL) {
  const base = new URL(process.env.ARTICLE_BASE_URL);
  if (!['localhost', '127.0.0.1'].includes(base.hostname)) {
    throw new Error('ARTICLE_BASE_URL must point to a local test server');
  }
  for (const lang of ['en', 'de']) {
    test(`${lang}: built article route, language switch and local figure`, async () => {
      const route = `/blog/${slug}${lang === 'de' ? '/de' : ''}`;
      const response = await fetch(new URL(route, base), { signal: AbortSignal.timeout(30_000) });
      assert.equal(response.status, 200);
      const html = await response.text();
      assert.equal((html.match(/<h1\b/g) ?? []).length, 1);
      assert.match(html, lang === 'en' ? /Does Your Piano Need Tuning/ : /Muss dein Klavier gestimmt werden/);
      for (const suffix of ['', '/de']) assert.ok(html.includes(`/blog/${slug}${suffix}`));
      const asset = `/images/blog/hans-milde-piano-tuning/pitch-pattern-${lang}.svg`;
      assert.ok(html.includes(asset));
      assert.ok(html.includes('https://klavierbau-milde.de/klavier-stimmung-test'));
      assert.match(html, /<figcaption[\s>]/);
      assert.match(html, /<table[\s>]/);
      assert.doesNotMatch(html, /sandbox:|/);
      const image = await fetch(new URL(asset, base), { signal: AbortSignal.timeout(10_000) });
      assert.equal(image.status, 200);
      assert.match(image.headers.get('content-type') ?? '', /image\/svg\+xml/);
      assert.equal(await image.text(), read(`public${asset}`));
    });
  }
}
