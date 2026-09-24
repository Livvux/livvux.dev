import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const slug = 'animal-rescue-websites';
const read = (path) => readFileSync(new URL(path, root), 'utf8');
const sourceHosts = new Set([
  'pfotenweb.de',
  'docs.astro.build',
  'developer.wordpress.org',
  'web.dev',
  'www.w3.org',
]);
const articles = Object.fromEntries(
  ['en', 'de'].map((lang) => [lang, read(`content/${slug}/${lang}.mdx`)]),
);

function splitArticle(content) {
  const match = content.match(/^---\n([\s\S]+?)\n---\n([\s\S]+)$/);
  assert.ok(match, 'Article must have YAML frontmatter and a body');
  const fields = Object.fromEntries(
    [...match[1].matchAll(/^(\w+): "([^"\n]+)"$/gm)].map((entry) => [entry[1], entry[2]]),
  );
  return { fields, body: match[2] };
}

for (const [lang, content] of Object.entries(articles)) {
  const { fields, body } = splitArticle(content);

  test(`${lang}: native article metadata and lightweight MDX`, () => {
    for (const key of ['title', 'publishedAt', 'author', 'summary']) {
      assert.ok(fields[key], `Missing ${key}`);
    }
    assert.equal(fields.publishedAt, '2026-09-24');
    assert.equal(fields.author, 'Livvux');
    assert.ok(fields.summary.length >= 80 && fields.summary.length <= 220);
    assert.doesNotMatch(body, /^# /m, 'The blog page supplies the only h1');
    assert.ok((body.match(/^## /gm) ?? []).length >= 6);
    assert.equal((body.match(/^```/gm) ?? []).length % 2, 0, 'Code fences must close');
    assert.doesNotMatch(body, /<script|<iframe|<video|dangerouslySetInnerHTML|sandbox:||utm_source/i);
    assert.doesNotMatch(body, /^import\s|^export\s/m, 'The article needs no runtime component');
  });

  test(`${lang}: footnotes resolve and source links use primary documentation`, () => {
    const definitions = [...body.matchAll(/^\[\^([^\]]+)\]: (.+)$/gm)];
    const ids = definitions.map((match) => match[1]);
    assert.equal(ids.length, new Set(ids).size, 'Duplicate footnote definition');
    assert.equal(ids.length, 8);
    const prose = body.replace(/^\[\^[^\]]+\]: .+$/gm, '');
    const references = [...new Set([...prose.matchAll(/\[\^([^\]]+)\]/g)].map((m) => m[1]))];
    assert.deepEqual(references.sort(), [...ids].sort());
    const links = [...body.matchAll(/\]\(([^)]+)\)/g)].map((match) => match[1]);
    for (const link of links) {
      if (link.startsWith('/')) {
        assert.equal(link, `/blog/technology-animal-welfare${lang === 'de' ? '/de' : ''}`);
      } else {
        const url = new URL(link);
        assert.equal(url.protocol, 'https:');
        assert.ok(sourceHosts.has(url.hostname), url.href);
        assert.equal(url.search, '', 'No tracking or credential query strings');
      }
    }
    assert.ok(links.includes('https://pfotenweb.de/'));
    assert.ok(links.some((link) => link.startsWith('/blog/technology-animal-welfare')));
  });

  test(`${lang}: ownership, recommendations and human follow-up remain explicit`, () => {
    const introduction = body.slice(0, body.indexOf('\n## '));
    assert.match(introduction, lang === 'de' ? /mein eigenes Projekt/ : /my own project/);
    assert.match(body, lang === 'de' ? /Astro oder WordPress/ : /Astro or WordPress/);
    assert.match(body, lang === 'de'
      ? /Jimdo und andere allgemeine Baukastensysteme nicht/
      : /I do not recommend Jimdo or other general-purpose website builders/);
    assert.match(body, lang === 'de' ? /Nachbetreuung/ : /support after adoption/);
    assert.match(body, lang === 'de' ? /Erfahrungen von Adoptanten/ : /adopter experiences/i);
    assert.match(body, lang === 'de'
      ? /Hilfe darf nicht davon abhängen/
      : /receiving help should never depend/);
    assert.match(body, lang === 'de'
      ? /Es ersetzt die eigene Website nicht/
      : /It does not replace the organization's own website/);
    assert.match(body, lang === 'de'
      ? /keine Behauptung, dass Pfotenweb all diese Abläufe automatisch umsetzt/
      : /not a claim that Pfotenweb automatically implements every workflow/);
  });

  test(`${lang}: technical examples and performance targets are qualified`, () => {
    assert.match(body, /interface PublicAnimalProfile/);
    assert.match(body, /status: "available" \| "reserved" \| "adopted"/);
    assert.match(body, /reviewedAt: string/);
    assert.match(body, lang === 'de'
      ? /nicht das interne Datenmodell von Pfotenweb/
      : /not Pfotenweb's internal data model/);
    assert.match(body, /2[,.]5/);
    assert.match(body, /200/);
    assert.match(body, /0[,.]1/);
    assert.match(body, /75\. Perzentil|75th percentile/);
    assert.match(body, lang === 'de'
      ? /keine hier gemessenen Ergebnisse/
      : /not results measured here/);
    assert.match(body, /Live Collections|live collections/);
    assert.match(body, /serverseitig|on the server/);
    assert.match(body, lang === 'de' ? /Wiederherstellung testen/ : /test restoring backups/);
  });
}

test('both translations use the same public model and technical references', () => {
  const code = (content) => content.match(/```ts\n([\s\S]+?)\n```/)[1]
    .replace(/\/\/[^\n]*/g, '').replace(/\s+/g, ' ').trim();
  assert.equal(code(articles.en), code(articles.de));
  const sources = (content) => [...content.matchAll(/^\[\^([^\]]+)\]:.*?\]\((https:\/\/[^)]+)\)/gm)]
    .map((entry) => `${entry[1]}: ${entry[2]}`).sort();
  assert.deepEqual(sources(articles.en), sources(articles.de));
});

test('source notes separate supplied material, documentation and editorial proposals', () => {
  const notes = read('docs/animal-rescue-websites-article-sources.md');
  assert.match(notes, /Website für Tierschutzvereine\.docx/);
  assert.match(notes, /not a live performance audit/);
  assert.match(notes, /not Pfotenweb implementation claims/);
  assert.match(notes, /No adopter quotes, case studies, conversion figures or ranking results were invented/);
});

// These integration checks request the real production build; no HTML fixtures are used.
if (process.env.ARTICLE_BASE_URL) {
  const base = new URL(process.env.ARTICLE_BASE_URL);
  if (!['localhost', '127.0.0.1'].includes(base.hostname)) {
    throw new Error('ARTICLE_BASE_URL must point to a local test server');
  }
  const get = async (path) => {
    const response = await fetch(new URL(path, base), { signal: AbortSignal.timeout(30_000) });
    assert.equal(response.status, 200, `${path}: expected HTTP 200`);
    return response.text();
  };

  for (const [lang, content] of Object.entries(articles)) {
    test(`${lang}: production article, locale links, metadata and rendered references`, async () => {
      const route = `/blog/${slug}${lang === 'de' ? '/de' : ''}`;
      const html = await get(route);
      const { fields } = splitArticle(content);
      assert.equal((html.match(/<h1\b/g) ?? []).length, 1);
      assert.ok(html.includes(fields.title));
      assert.ok(html.includes(fields.summary));
      const article = html.match(/<article\b[^>]*>([\s\S]+?)<\/article>/)?.[1];
      assert.ok(article, 'Rendered article body is present');
      assert.match(article, /href="https:\/\/pfotenweb\.de\/"/);
      assert.match(article, lang === 'de' ? /mein eigenes Projekt/ : /my own project/);
      assert.match(article, /PublicAnimalProfile/);
      assert.match(article, /data-footnotes/);
      assert.doesNotMatch(article, /\[\^|sandbox:||<iframe|<video/);
      const linkTags = [...html.matchAll(/<link\b[^>]*>/gi)].map(([tag]) =>
        Object.fromEntries([...tag.matchAll(/([a-z-]+)="([^"]*)"/gi)]
          .map((attribute) => [attribute[1].toLowerCase(), attribute[2]])),
      );
      assert.ok(linkTags.some((link) => link.rel === 'canonical'
        && link.href === `https://livvux.dev${route}`));
      for (const [locale, suffix] of [['en', ''], ['de', '/de']]) {
        assert.ok(linkTags.some((link) => link.rel === 'alternate'
          && link.hreflang === locale
          && link.href === `https://livvux.dev/blog/${slug}${suffix}`));
      }
      const translationRoute = `/blog/${slug}${lang === 'en' ? '/de' : ''}`;
      assert.ok(html.includes(`href="${translationRoute}"`), 'Link to the other language');
      await get(`/blog/technology-animal-welfare${lang === 'de' ? '/de' : ''}`);
    });
  }

  test('the production blog index includes the new article', async () => {
    const html = await get('/blog');
    assert.ok(html.includes(`href="/blog/${slug}"`));
  });
}
