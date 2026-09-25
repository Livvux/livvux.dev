import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const slug = 'screen-recorders-recordly-screendrop-screen-studio-cap';
const read = (path) => readFileSync(new URL(path, root), 'utf8');
const languages = ['en', 'de'];
const articles = Object.fromEntries(languages.map((lang) =>
  [lang, read(`content/${slug}/${lang}.mdx`)]));
const hosts = new Set(['recordly.dev', 'github.com', 'screen.studio', 'cap.so']);
const links = (text) => [...text.matchAll(/\]\(([^)]+)\)/g)].map((match) => match[1]);
const parse = (text) => {
  const match = text.match(/^---\n([\s\S]+?)\n---\n([\s\S]+)$/);
  assert.ok(match, 'Frontmatter and a body are required');
  const fields = Object.fromEntries([...match[1].matchAll(/^(\w+): "([^"\n]+)"$/gm)]
    .map((field) => [field[1], field[2]]));
  return { fields, body: match[2] };
};
const tableGroups = (body) => body.split(/\n\s*\n/)
  .filter((block) => block.startsWith('| ') && block.split('\n')[1]?.includes('---'));

for (const [lang, text] of Object.entries(articles)) {
  const { fields, body } = parse(text);
  test(`${lang}: native metadata, complete body and safe MDX content`, () => {
    for (const field of ['title', 'publishedAt', 'author', 'summary']) assert.ok(fields[field], field);
    assert.equal(fields.author, 'Livvux');
    assert.equal(fields.publishedAt, '2026-09-25');
    assert.ok(fields.summary.length >= 80 && fields.summary.length <= 220);
    assert.ok(body.split(/\s+/).length >= 1800, 'Both languages must contain the full comparison');
    assert.doesNotMatch(body, /^# /m, 'The page already supplies the h1');
    assert.doesNotMatch(body, /<script|<iframe|dangerouslySetInnerHTML|sandbox:||utm_source/i);
    assert.doesNotMatch(body, /^import\s|^export\s/m, 'Content must not require new runtime components');
    for (const product of ['Recordly', 'Screendrop', 'Screen Studio', 'Cap']) {
      assert.ok(body.split('\n').some((line) => line.startsWith(`## ${product}:`)), product);
    }
  });

  test(`${lang}: all comparison tables have consistent columns`, () => {
    const tables = tableGroups(body);
    assert.equal(tables.length, 4);
    for (const table of tables) {
      const rows = table.split('\n').filter(Boolean);
      const columns = rows[0].split('|').length;
      assert.ok(columns >= 5 && columns <= 7);
      for (const row of rows) assert.equal(row.split('|').length, columns, row);
      assert.ok(rows.length >= 6, 'Include all four products');
    }
  });

  test(`${lang}: primary-source links and locale-correct internal link`, () => {
    const targets = links(body);
    assert.ok(new Set(targets).size >= 20);
    for (const target of targets) {
      if (target.startsWith('/')) {
        assert.equal(target, `/blog/code-must-be-free${lang === 'de' ? '/de' : ''}`);
        continue;
      }
      const url = new URL(target);
      assert.equal(url.protocol, 'https:');
      assert.ok(hosts.has(url.hostname), target);
      assert.equal(url.username + url.password + url.search, '');
    }
    assert.ok(targets.includes('https://github.com/fayazara/screendrop-worker'));
    assert.ok(targets.includes('https://cap.so/docs/commercial-license'));
    assert.ok(targets.includes('https://screen.studio/guide/captions'));
  });

  test(`${lang}: research limitations and the important distinctions remain visible`, () => {
    assert.match(body, lang === 'de' ? /nicht auf einem Praxistest aller vier Apps/ : /not a hands-on benchmark of all four apps/);
    assert.match(body, /26\.4\+/);
    assert.match(body, /GPUI/);
    assert.match(body, /CC0-1\.0/);
    assert.match(body, /AGPL/);
    assert.match(body, lang === 'de' ? /keine Anmeldung für Zuschauer/ : /not viewer authentication/);
    assert.match(body, lang === 'de' ? /nicht beliebiger Systemton/ : /not arbitrary system audio/);
    assert.match(body, lang === 'de' ? /selbst aus dem Quellcode/ : /build yourself from source/);
    assert.match(body, lang === 'de' ? /vorgeschlagener Test/ : /proposed test/);
  });
}

test('both translations cite the same external evidence', () => {
  const external = (text) => [...new Set(links(text).filter((link) => !link.startsWith('/')))].sort();
  assert.deepEqual(external(articles.en), external(articles.de));
});

test('published annual totals agree with the cited monthly prices', () => {
  for (const [monthly, annual] of [[29, 348], [9, 108], [12, 144], [8.16, 97.92]]) {
    assert.equal(Math.round(monthly * 12 * 100), Math.round(annual * 100));
    assert.ok(articles.en.includes(String(annual)));
    assert.ok(articles.de.includes(String(annual).replace('.', ',')));
  }
});

// CI can exercise actual production routes after next build; no HTML fixtures.
if (process.env.ARTICLE_BASE_URL) {
  const base = new URL(process.env.ARTICLE_BASE_URL);
  assert.ok(['localhost', '127.0.0.1'].includes(base.hostname), 'Integration mode is local-only');
  const get = async (path) => {
    const response = await fetch(new URL(path, base), { signal: AbortSignal.timeout(30000) });
    assert.equal(response.status, 200, path);
    return response.text();
  };
  for (const lang of languages) {
    test(`${lang}: rendered article, links, canonical and language alternate`, async () => {
      const suffix = lang === 'de' ? '/de' : '';
      const route = `/blog/${slug}${suffix}`;
      const html = await get(route);
      const { fields } = parse(articles[lang]);
      assert.equal((html.match(/<h1\b/g) ?? []).length, 1);
      assert.ok(html.includes(fields.title));
      assert.ok(html.includes(fields.summary));
      const article = html.match(/<article\b[^>]*>([\s\S]+?)<\/article>/)?.[1];
      assert.ok(article);
      assert.equal((article.match(/<table\b/g) ?? []).length, 4);
      assert.doesNotMatch(article, /sandbox:|/);
      const anchors = [...article.matchAll(/<a\b[^>]*>/g)].map(([tag]) => tag);
      for (const href of ['https://recordly.dev/', 'https://github.com/fayazara/Screendrop', 'https://screen.studio/', 'https://cap.so/']) {
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
      await get(`/blog/code-must-be-free${suffix}`);
    });
  }
  test('blog index contains the new article', async () => {
    assert.ok((await get('/blog')).includes(`href="/blog/${slug}"`));
  });
}
