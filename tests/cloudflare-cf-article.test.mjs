import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const slug = 'cloudflare-cf-cli';
const read = (path) => readFileSync(new URL(path, root), 'utf8');
const titles = {
  en: 'Cloudflare cf CLI: Less Clicking, Better Tools for AI Agents',
  de: 'Cloudflare cf CLI: Weniger Klicks, bessere Tools für KI-Agenten',
};
const upstream = 'https://github.com/cloudflare/cf';
const sources = [
  'https://blog.cloudflare.com/cloudflare-cf-cli-launch/',
  upstream,
  `${upstream}/blob/main/packages/cli/README.md`,
  `${upstream}/blob/main/packages/cli/src/commands/login/index.ts`,
  `${upstream}/blob/main/packages/cli/src/commands/migrate/index.ts`,
  `${upstream}/blob/main/packages/cli/src/lib/wrangler-migration.ts`,
  `${upstream}/blob/main/packages/cli/src/index.ts`,
];
const bodies = {};
const links = (text) => [...text.matchAll(/\]\(([^)]+)\)/g)].map((match) => match[1]);
const codeBlocks = (text) => [...text.matchAll(/^```bash\n([\s\S]*?)^```$/gm)].map((match) => match[1]);

for (const lang of ['en', 'de']) {
  const content = read(`content/${slug}/${lang}.mdx`);
  bodies[lang] = content;

  test(`${lang}: metadata and article structure match the blog collection`, () => {
    const frontmatter = content.match(/^---\n([\s\S]+?)\n---\n/);
    assert.ok(frontmatter);
    const metadata = Object.fromEntries(
      [...frontmatter[1].matchAll(/^(\w+): "([^"\n]+)"$/gm)].map((match) => [match[1], match[2]]),
    );
    assert.equal(metadata.title, titles[lang]);
    assert.equal(metadata.publishedAt, '2026-09-29');
    assert.equal(metadata.author, 'Livvux');
    assert.ok(metadata.summary.length >= 80 && metadata.summary.length <= 200);
    assert.ok(content.split(/\s+/).length >= 1000, 'Must contain the complete article');
    assert.doesNotMatch(content, /^# /m, 'The route owns the h1');
    assert.doesNotMatch(content, /<script|<iframe|dangerouslySetInnerHTML|cite|sandbox:/);
    assert.equal((content.match(/^```/gm) ?? []).length, codeBlocks(content).length * 2);
    assert.ok(content.endsWith('\n'));
  });

  test(`${lang}: primary sources and related articles are linked`, () => {
    const articleLinks = links(content);
    for (const source of sources) assert.ok(articleLinks.includes(source), `Missing ${source}`);
    assert.ok(articleLinks.includes('/blog/cloudflare-quick-tunnels-one-command'));
    assert.ok(articleLinks.includes('/blog/code-must-be-free'));
    for (const link of articleLinks.filter((value) => !value.startsWith('/'))) {
      const url = new URL(link);
      assert.equal(url.protocol, 'https:');
      assert.ok(['github.com', 'blog.cloudflare.com'].includes(url.hostname));
    }
  });

  test(`${lang}: installation and authentication preserve the documented distinction`, () => {
    assert.match(content, /Node\.js 22/);
    assert.match(content, /npm install --global cf/);
    assert.match(content, /cf login` (?:is an alias for|ist ein Alias für) `cf auth login/);
    assert.match(content, /CLOUDFLARE_API_TOKEN/);
    assert.match(content, /precedence over OAuth|Vorrang vor OAuth/);
    assert.match(content, /not both in sequence|nicht beide hintereinander/);
  });

  test(`${lang}: migration includes preview, follow-up handling and new-file review`, () => {
    const commands = codeBlocks(content).join('\n');
    assert.match(commands, /git switch -c chore\/migrate-to-cf\ncf migrate --dry-run/);
    assert.match(commands, /git status --short\ngit diff --stat\ngit diff\ncf build/);
    assert.doesNotMatch(commands, /cf migrate.*--force|git reset|git clean/);
    assert.match(content, /required follow-up work|erforderliche Nacharbeiten/);
    assert.match(content, /does not show untracked files|zeigt keine unversionierten Dateien/);
    assert.match(content, /@cloudflare\/vite-plugin/);
    assert.match(content, /otherwise to Wrangler|andernfalls Wrangler/);
  });

  test(`${lang}: agent features and beta claims retain their limits`, () => {
    assert.match(content, /cf cli search "list DNS records"/);
    assert.match(content, /not a built-in permission system|kein eingebautes Berechtigungssystem/);
    assert.match(content, /text and binary endpoints|Text- und Binär-Endpunkte/);
    assert.match(content, /rather than silently falling through to production|statt still auf Produktion auszuweichen/);
    assert.match(content, /18 months after the beta ends|18 Monate Wrangler-Wartung nach Ende der Beta/);
    assert.match(content, /not after launch|nicht ab Veröffentlichung/);
    assert.match(content, /roadmap|Roadmap/);
    assert.match(content, /not a hands-on deployment benchmark|kein eigener Deployment-Benchmark/);
  });

  test(`${lang}: publishing remains a separate command from local development`, () => {
    const blocks = codeBlocks(content);
    assert.ok(blocks.some((block) => block === 'cf init my-worker\ncd my-worker\ncf dev\n'));
    assert.ok(blocks.some((block) => block === 'cf deploy\n'));
    assert.ok(blocks.every((block) => !(block.includes('cf dev') && block.includes('cf deploy'))));
    assert.match(content, /tunnel exposes a running local service|Tunnel macht einen laufenden lokalen Dienst erreichbar/);
  });
}

test('translations preserve section levels, links and runnable command examples', () => {
  const headings = (text) => [...text.matchAll(/^(#{2,3}) /gm)].map((match) => match[1]);
  assert.deepEqual(headings(bodies.en), headings(bodies.de));
  assert.deepEqual([...new Set(links(bodies.en))].sort(), [...new Set(links(bodies.de))].sort());
  assert.deepEqual(codeBlocks(bodies.en), codeBlocks(bodies.de));
});

test('provenance describes source review and the limits of local validation', () => {
  const notes = read('docs/cloudflare-cf-article-sources.md');
  assert.match(notes, /No Cloudflare account was authenticated or modified/);
  assert.match(notes, /No generated images/);
  assert.match(notes, /do not substitute for an MDX compile/);
  assert.match(notes, /full-site build was not run/);
});

// These run against the actual production server in CI, not fabricated HTML.
if (process.env.ARTICLE_BASE_URL) {
  const base = new URL(process.env.ARTICLE_BASE_URL);
  assert.ok(['localhost', '127.0.0.1'].includes(base.hostname), 'Use a local test server');
  for (const lang of ['en', 'de']) {
    test(`${lang}: production page, metadata and translation links render`, async () => {
      const path = `/blog/${slug}${lang === 'de' ? '/de' : ''}`;
      const response = await fetch(new URL(path, base), { signal: AbortSignal.timeout(30_000) });
      assert.equal(response.status, 200);
      const html = await response.text();
      assert.equal((html.match(/<h1\b/g) ?? []).length, 1);
      assert.ok(html.includes(titles[lang]));
      assert.ok(html.includes('rel="canonical"'));
      assert.ok(html.includes(`/blog/${slug}/de`));
      assert.ok(html.includes(`/blog/${slug}`));
      assert.ok(html.includes('/blog/cloudflare-quick-tunnels-one-command'));
      assert.ok(html.includes('/blog/code-must-be-free'));
      assert.ok(html.includes('https://blog.cloudflare.com/cloudflare-cf-cli-launch/'));
      assert.ok(html.includes('<pre'));
    });
  }
}
