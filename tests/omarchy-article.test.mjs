import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const slug = 'why-linux-omarchy-gaming';
const languages = ['en', 'de'];
const articles = Object.fromEntries(languages.map((lang) => [
  lang, readFileSync(new URL(`content/${slug}/${lang}.mdx`, root), 'utf8'),
]));
const image = 'https://omarchy.org/manual/images/gaming-steam.webp';
const links = (text) => [...text.matchAll(/\]\(([^)]+)\)/g)].map((match) => match[1]);
const parse = (text) => {
  const match = text.match(/^---\n([\s\S]+?)\n---\n([\s\S]+)$/);
  assert.ok(match, 'Frontmatter and body are required');
  const fields = Object.fromEntries([...match[1].matchAll(/^(\w+): "([^"\n]+)"$/gm)]
    .map((field) => [field[1], field[2]]));
  return { fields, body: match[2] };
};
const requiredLinks = [
  'https://omarchy.org/',
  'https://omarchy.org/manual/ai/',
  'https://omarchy.org/manual/gaming/',
  'https://omarchy.org/manual/getting-started/',
  'https://omarchy.org/manual/dual-boot-install/',
  'https://omarchy.org/manual/updates/',
  'https://www.youtube.com/results?search_query=why+linux',
  'https://www.youtube.com/watch?v=9SDkU5VDQEQ',
  'https://www.youtube.com/watch?v=5JPYJfN7HY0',
  'https://github.com/ValveSoftware/Proton',
  'https://www.steamdeck.com/en/software',
  'https://partner.steamgames.com/doc/steamhardware/proton',
  'https://store.steampowered.com/hwsurvey/',
  'https://blogs.windows.com/windows-insider/2026/03/20/our-commitment-to-windows-quality/',
];

for (const lang of languages) {
  const { fields, body } = parse(articles[lang]);
  test(`${lang}: native metadata and complete, inert article content`, () => {
    for (const field of ['title', 'publishedAt', 'author', 'summary']) assert.ok(fields[field], field);
    assert.equal(fields.publishedAt, '2026-09-25');
    assert.equal(fields.author, 'Livvux');
    assert.ok(fields.summary.length >= 80 && fields.summary.length <= 220);
    assert.ok(body.split(/\s+/).length >= 1400);
    assert.doesNotMatch(body, /^# /m, 'The page supplies the sole h1');
    assert.doesNotMatch(body, /<script|<iframe|dangerouslySetInnerHTML|sandbox:||utm_source/i);
    assert.doesNotMatch(body, /^import\s|^export\s/m);
  });

  test(`${lang}: user links, supporting sources and locale-correct internal link`, () => {
    const targets = links(body);
    for (const url of requiredLinks) assert.ok(targets.includes(url), url);
    assert.ok(targets.includes(`/blog/code-must-be-free${lang === 'de' ? '/de' : ''}`));
    for (const target of targets.filter((url) => !url.startsWith('/'))) {
      const url = new URL(target);
      assert.equal(url.protocol, 'https:');
      assert.equal(url.username + url.password, '');
    }
  });

  test(`${lang}: localized and attributed official screenshot, not a fabricated benchmark`, () => {
    const images = [...body.matchAll(/<img\b[^>]*>/g)].map(([tag]) => tag);
    assert.equal(images.length, 1);
    assert.ok(images[0].includes(`src="${image}"`));
    assert.match(images[0], /width="1000" height="663"/);
    assert.match(images[0], /loading="lazy"/);
    assert.match(images[0], /referrerPolicy="no-referrer"/);
    assert.match(images[0], lang === 'de' ? /alt="Steam-Store[^\"]+"/ : /alt="Steam's store[^\"]+"/);
    assert.match(body, /<figcaption>[\s\S]+omarchy\.org[\s\S]+<\/figcaption>/);
    assert.match(body, lang === 'de' ? /kein eigener Omarchy-Praxistest/ : /not my own hands-on Omarchy benchmark/);
  });

  test(`${lang}: dated survey table and a decrease, not a manufactured growth claim`, () => {
    const tables = body.split(/\n\s*\n/).filter((block) => block.startsWith('| '));
    assert.equal(tables.length, 1);
    const rows = tables[0].split('\n').filter(Boolean);
    assert.equal(rows.length, 5);
    for (const row of rows) assert.equal(row.split('|').length, 4);
    const values = rows.slice(2).map((row) => Number(row.split('|')[2].replace('%', '').trim().replace(',', '.')));
    assert.deepEqual(values, [93.95, 3.90, 2.14]);
    assert.ok(Math.abs(values.reduce((sum, value) => sum + value, 0) - 100) < 0.02, 'Allow published rounding');
    assert.match(body, /August 2026/);
    assert.match(body, lang === 'de' ? /verlor[\s\S]{0,80}0,11 Prozentpunkte/ : /fell[\s\S]{0,40}0\.11 percentage points/);
    assert.match(body, lang === 'de' ? /Teilnahme ist freiwillig/ : /Participation is voluntary/);
  });

  test(`${lang}: editorial caveats survive translation`, () => {
    for (const term of ['Microslop', 'NetworkChuck', 'typecraft', 'Hyprland', 'Quickshell', 'Proton', 'Steam Deck', 'Easy Anti-Cheat', 'BattlEye', 'GitHub Copilot CLI', 'Secure Boot']) assert.ok(body.includes(term), term);
    assert.match(body, lang === 'de' ? /keine repräsentative Umfrage/ : /not a representative survey/);
    assert.match(body, lang === 'de' ? /keine Nutzerstatistik/ : /not adoption statistics/);
    assert.match(body, lang === 'de' ? /automatischer Freigabe/ : /auto-approving modes/);
    assert.match(body, lang === 'de' ? /löscht das ausgewählte Laufwerk/ : /erases the selected drive/);
    assert.match(body, lang === 'de' ? /erweiterte Sicherheitsupdates/ : /Extended Security Updates/);
    assert.match(body, lang === 'de' ? /14\. Oktober 2025/ : /October 14, 2025/);
  });
}

test('both translations include the same external evidence and section structure', () => {
  const external = (text) => [...new Set(links(text).filter((url) => !url.startsWith('/')))].sort();
  assert.deepEqual(external(articles.en), external(articles.de));
  assert.deepEqual(articles.en.match(/^#{2,3} /gm), articles.de.match(/^#{2,3} /gm));
});

// Optional integration checks target an actual local production server, not fixtures.
if (process.env.ARTICLE_BASE_URL) {
  const base = new URL(process.env.ARTICLE_BASE_URL);
  assert.ok(['localhost', '127.0.0.1'].includes(base.hostname), 'Integration mode is local-only');
  const get = async (path) => {
    const response = await fetch(new URL(path, base), { signal: AbortSignal.timeout(30000) });
    assert.equal(response.status, 200, path);
    return response.text();
  };
  for (const lang of languages) {
    test(`${lang}: production article, screenshot, canonical, language switch and safe external links`, async () => {
      const route = `/blog/${slug}${lang === 'de' ? '/de' : ''}`;
      const html = await get(route);
      assert.equal((html.match(/<h1\b/g) ?? []).length, 1);
      assert.ok(html.includes(parse(articles[lang]).fields.title));
      const body = html.match(/<article\b[^>]*>([\s\S]+?)<\/article>/)?.[1];
      assert.ok(body, 'Rendered article is present');
      assert.equal((body.match(/<table\b/g) ?? []).length, 1);
      assert.ok(body.includes(image));
      assert.doesNotMatch(body, /sandbox:|/);
      const anchors = [...body.matchAll(/<a\b[^>]*>/g)].map(([tag]) => tag);
      for (const href of requiredLinks) {
        const tag = anchors.find((anchor) => anchor.includes(`href="${href}"`));
        assert.ok(tag, href);
        assert.match(tag, /target="_blank"/);
        assert.match(tag, /rel="[^"]*noopener/);
      }
      const meta = [...html.matchAll(/<link\b[^>]*>/gi)].map(([tag]) =>
        Object.fromEntries([...tag.matchAll(/([a-z-]+)="([^"]*)"/gi)]
          .map((match) => [match[1].toLowerCase(), match[2]])));
      assert.ok(meta.some((tag) => tag.rel === 'canonical' && tag.href === `https://livvux.dev${route}`));
      for (const locale of languages) {
        assert.ok(meta.some((tag) => tag.rel === 'alternate' && tag.hreflang === locale
          && tag.href === `https://livvux.dev/blog/${slug}${locale === 'de' ? '/de' : ''}`));
      }
      assert.ok(html.includes(`href="/blog/${slug}${lang === 'en' ? '/de' : ''}"`));
    });
  }
  test('production blog index links to the article', async () => {
    assert.ok((await get('/blog')).includes(`href="/blog/${slug}"`));
  });
}
