import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const slug = 'ai-game-modding-reverse-engineering';
const video = 'https://www.youtube.com/watch?v=h5zkzon0gM4';
const timestamps = [0, 76, 208, 336, 595, 542, 289, 717, 745, 59];
const projectSources = [
  'https://github.com/rehan-remade/universal-modder',
  'https://github.com/morluto/rea',
  'https://github.com/NationalSecurityAgency/ghidra',
  'https://github.com/icsharpcode/ILSpy',
];
const titles = {
  de: 'KI-Modding: Warum mich diese Spiele-Mashups so umhauen',
  en: 'AI Game Modding: Why These Mashups Honestly Blow My Mind',
};
const posts = {};
const links = (body) => [...body.matchAll(/\]\(([^)]+)\)/g)].map((match) => match[1]);

for (const lang of ['en', 'de']) {
  const body = readFileSync(new URL(`content/${slug}/${lang}.mdx`, root), 'utf8');
  const frontmatter = body.match(/^---\n([\s\S]+?)\n---\n/);
  assert.ok(frontmatter, `${lang}: frontmatter is present`);
  const metadata = Object.fromEntries(frontmatter[1].split('\n').map((line) => {
    const entry = line.match(/^(\w+): ("[^"\n]+")$/);
    assert.ok(entry, `${lang}: quoted metadata entry: ${line}`);
    return [entry[1], JSON.parse(entry[2])];
  }));
  posts[lang] = { body, metadata };

  test(`${lang}: valid metadata and a complete standalone article`, () => {
    assert.equal(metadata.title, titles[lang]);
    assert.equal(metadata.author, 'Livvux');
    assert.equal(metadata.publishedAt, '2026-10-06');
    assert.ok(metadata.summary.length >= 100 && metadata.summary.length <= 170);
    assert.ok(body.split(/\s+/).length >= 1000);
    assert.doesNotMatch(body, /^# /m, 'The route renders the only h1');
    assert.doesNotMatch(body, /<script|<iframe|dangerouslySetInnerHTML|cite|filecite|sandbox:|utm_source=/);
    assert.ok(body.endsWith('\n'));
  });

  test(`${lang}: original video, chapter links and supplementary project sources`, () => {
    const targets = links(body);
    for (const source of [video, ...timestamps.map((seconds) => `${video}&t=${seconds}s`), ...projectSources]) {
      assert.ok(targets.includes(source), `${lang}: missing ${source}`);
    }
    assert.match(body, /Passthrough|passthrough/);
    assert.match(body, /Mirror’s Edge/);
    assert.match(body, /Skate 3|Skate-3/);
    assert.match(body, /Rust/);
    assert.match(body, /Virtual Reality|virtual reality/);
  });

  test(`${lang}: personal perspective remains distinct from unverified claims`, () => {
    assert.match(body, /crazy/);
    assert.match(body, /nicht selbst nachgebaut oder getestet|not rebuilt or tested/);
    assert.match(body, /ergänzende Dokumentationslinks|supplementary documentation links/);
    assert.match(body, /99 Prozent nach vier Versuchen|99 percent after four attempts/);
    assert.match(body, /nicht unabhängig verifiziert|not independently verified/);
    assert.match(body, /nicht als Beleg dafür|not treat that number as evidence/);
    assert.match(body, /meine Schlussfolgerung|my interpretation/);
    assert.match(body, /Lizenziertem|lizenziertem|licensed/);
    assert.match(body, /bereitgestellte Transkript|supplied transcript/);
  });

  test(`${lang}: HTTPS-only external links and a locale-correct related post`, () => {
    const related = `/blog/ai-motion-design${lang === 'de' ? '/de' : ''}`;
    assert.ok(links(body).includes(related));
    for (const target of links(body)) {
      if (target.startsWith('/')) {
        assert.equal(target, related);
        assert.ok(!target.startsWith('//'));
        continue;
      }
      const url = new URL(target);
      assert.equal(url.protocol, 'https:');
      assert.ok(['www.youtube.com', 'github.com'].includes(url.hostname));
      assert.equal(url.username, '');
      assert.equal(url.password, '');
      if (url.hostname === 'www.youtube.com') {
        assert.equal(url.pathname, '/watch');
        assert.equal(url.searchParams.get('v'), 'h5zkzon0gM4');
        assert.ok([...url.searchParams.keys()].every((key) => ['v', 't'].includes(key)));
      }
    }
  });
}

test('English and German preserve the section hierarchy', () => {
  const headings = (body) => [...body.matchAll(/^(#{2,3}) /gm)].map((match) => match[1]);
  assert.deepEqual(headings(posts.en.body), headings(posts.de.body));
  assert.equal(headings(posts.en.body).filter((heading) => heading === '###').length, 3);
});

test('English and German preserve source links and localize the related article', () => {
  const normalize = (body) => [...new Set(links(body).map((link) => link.replace(/^\/blog\/ai-motion-design\/de$/, '/blog/ai-motion-design')))].sort();
  assert.deepEqual(normalize(posts.en.body), normalize(posts.de.body));
});

// Optional integration checks: run only against a real local production server.
// Static tests above validate the article structure, not the video's technical claims.
if (process.env.ARTICLE_BASE_URL) {
  const base = new URL(process.env.ARTICLE_BASE_URL);
  assert.ok(['localhost', '127.0.0.1'].includes(base.hostname));
  for (const lang of ['en', 'de']) {
    test(`${lang}: built route renders article, canonical and alternate language`, async () => {
      const path = `/blog/${slug}${lang === 'de' ? '/de' : ''}`;
      const response = await fetch(new URL(path, base), { signal: AbortSignal.timeout(30_000) });
      assert.equal(response.status, 200);
      const html = await response.text();
      assert.equal((html.match(/<h1\b/g) ?? []).length, 1);
      assert.ok(html.includes(titles[lang]));
      assert.ok(html.includes(posts[lang].metadata.summary));
      assert.ok(html.includes(`rel="canonical" href="https://livvux.dev${path}"`));
      assert.ok(html.includes(`/blog/${slug}/de`));
      assert.ok(html.includes(`/blog/${slug}`));
      assert.ok(html.includes(`lang="${lang}"`));
      assert.ok(html.includes('mashup-mods'));
      const anchors = [...html.matchAll(/<a\b[^>]*>/g)].map((match) => match[0]);
      for (const source of [video, ...projectSources]) {
        const anchor = anchors.find((tag) => tag.includes(`href="${source}"`));
        assert.ok(anchor, `Rendered source: ${source}`);
        assert.match(anchor, /target="_blank"/);
        assert.match(anchor, /rel="[^"]*noopener/);
        assert.match(anchor, /rel="[^"]*noreferrer/);
      }
      assert.doesNotMatch(html, /<iframe\b[^>]*youtube|<script\b[^>]*youtube/);
    });
  }
}
