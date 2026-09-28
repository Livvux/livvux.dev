import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const slug = 'jev-ai-fast-decisions';
const read = (path) => readFileSync(new URL(path, root), 'utf8');
const titles = {
  en: 'Jev: What It Is and Why People Are Hyping It',
  de: 'Jev: Was es ist und warum es gerade gehypt wird',
};
const sources = [
  'https://docs.typesafe.ai/introduction',
  'https://typesafe.ai/blog/introducing-system-one-models-and-jev',
  'https://docs.typesafe.ai/concepts/system-one',
  'https://docs.typesafe.ai/primitives',
  'https://evals.typesafe.ai/',
  'https://spring.io/blog/2026/09/21/spring-ai-typesafe-structured-judgment/',
  'https://docs.typesafe.ai/introduction/machine-learning-primer',
  'https://docs.typesafe.ai/patterns/fan-out',
  'https://docs.typesafe.ai/cookbooks/parallel_questions',
  'https://github.com/browser-use/jev-ultrafast',
  'https://docs.typesafe.ai/confidence',
  'https://docs.typesafe.ai/models',
  'https://docs.typesafe.ai/model-jaggedness/jev-1.13',
  'https://docs.typesafe.ai/primitives/choice',
];
const bodies = {};
const externalLinks = (text) => [...text.matchAll(/\]\((https:\/\/[^)]+)\)/g)].map((m) => m[1]);

for (const lang of ['en', 'de']) {
  const content = read(`content/${slug}/${lang}.mdx`);
  bodies[lang] = content;

  test(`${lang}: frontmatter fits the repository and preserves one h1`, () => {
    const frontmatter = content.match(/^---\n([\s\S]+?)\n---\n/);
    assert.ok(frontmatter);
    const metadata = Object.fromEntries(
      [...frontmatter[1].matchAll(/^(\w+): "([^"\n]+)"$/gm)].map((m) => [m[1], m[2]]),
    );
    assert.equal(metadata.title, titles[lang]);
    assert.equal(metadata.publishedAt, '2026-09-28');
    assert.equal(metadata.author, 'Livvux');
    assert.ok(metadata.summary.length >= 80 && metadata.summary.length <= 200);
    assert.ok(content.split(/\s+/).length >= 1100, 'Full article, not placeholder copy');
    assert.doesNotMatch(content, /^# /m, 'The blog route owns the h1');
    assert.doesNotMatch(content, /<script|<iframe|dangerouslySetInnerHTML|cite|sandbox:/);
  });

  test(`${lang}: primary sources and existing tool are linked`, () => {
    const links = externalLinks(content);
    for (const source of sources) assert.ok(links.includes(source), `Missing ${source}`);
    for (const link of links) assert.equal(new URL(link).protocol, 'https:');
    assert.match(content, /\]\(\/tools\/internal-links\)/);
  });

  test(`${lang}: vendor, implementation and hypothetical timings stay distinct`, () => {
    assert.match(content, /70–500 ms/);
    assert.match(content, /193[.,]6/);
    assert.match(content, /444[.,]6/);
    assert.match(content, /275 ms/);
    assert.match(content, /310 ms/);
    assert.match(content, /7[.,]073/);
    assert.match(content, /0[.,]27 s/);
    assert.match(content, /2[.,]71 s/);
    assert.match(content, /five runs|fünf Durchläufe/);
    assert.match(content, /not Jev versus another model|nicht Jev mit einem anderen Modell/);
    assert.match(content, /illustrative agent|reines Rechenbeispiel/);
    assert.match(content, /not a new benchmark I ran|kein neuer Benchmark von mir/);
  });

  test(`${lang}: confidence, model limits and human review are not overclaimed`, () => {
    assert.match(content, /not automatically a measured 90%|nicht automatisch eine gemessene Erfolgsquote von 90/);
    assert.match(content, /without a separate confidence field|ohne separates Konfidenzfeld/);
    assert.match(content, /text-only and strongest in English|nur Text und ist auf Englisch am stärksten/);
    assert.match(content, /adversarial content|manipulative Eingaben/);
    assert.match(content, /still pick the wrong one|weiterhin die falsche auswählen/);
    assert.match(content, /not an automatic edit|keine automatische Änderung/);
  });
}

test('English and German have matching sections and source sets', () => {
  const headings = (text) => [...text.matchAll(/^(#{2,3}) /gm)].map((m) => m[1]);
  assert.deepEqual(headings(bodies.en), headings(bodies.de));
  assert.deepEqual([...new Set(externalLinks(bodies.en))].sort(), [...new Set(externalLinks(bodies.de))].sort());
});

test('arithmetic examples have the stated scope and correct values', () => {
  assert.equal(20 * 2, 40);
  assert.equal(20 * 0.2, 4);
  assert.equal((1_000_000 * 1_000 / 1_000_000) * 0.042, 42);
  for (const content of Object.values(bodies)) {
    assert.match(content, /excludes crawling, hosting, retries|Crawling, Hosting, erneute Versuche/);
    assert.match(content, /42/);
  }
});

test('provenance notes record measurement and live-verification boundaries', () => {
  const notes = read('docs/jev-article-sources.md');
  assert.match(notes, /No paid Jev calls/);
  assert.match(notes, /not a broad benchmark/);
  assert.match(notes, /does not claim a fresh live-site verification/);
  assert.match(notes, /No generated images/);
});

// CI runs these against a real Next.js production build, not mocked HTML.
if (process.env.ARTICLE_BASE_URL) {
  const base = new URL(process.env.ARTICLE_BASE_URL);
  assert.ok(['localhost', '127.0.0.1'].includes(base.hostname), 'Use a local test server');
  for (const lang of ['en', 'de']) {
    test(`${lang}: production route, metadata and translation navigation render`, async () => {
      const path = `/blog/${slug}${lang === 'de' ? '/de' : ''}`;
      const response = await fetch(new URL(path, base), { signal: AbortSignal.timeout(30_000) });
      assert.equal(response.status, 200);
      const html = await response.text();
      assert.equal((html.match(/<h1\b/g) ?? []).length, 1);
      assert.ok(html.includes(titles[lang]));
      assert.ok(html.includes('rel="canonical"'));
      assert.ok(html.includes(`/blog/${slug}/de`));
      assert.ok(html.includes(`/blog/${slug}`));
      assert.ok(html.includes('/tools/internal-links'));
      assert.ok(html.includes('https://docs.typesafe.ai/models'));
      assert.ok(html.includes('<table'));
    });
  }
}
