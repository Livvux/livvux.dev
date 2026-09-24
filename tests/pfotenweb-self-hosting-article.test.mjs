import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const slug = 'pfotenweb-self-hosting';
const read = (path) => readFileSync(new URL(path, root), 'utf8');
const articles = Object.fromEntries(['en', 'de'].map((lang) =>
  [lang, read(`content/${slug}/${lang}.mdx`)]));
const sourceHosts = new Set(['github.com', 'pfotenweb.de', 'docs.docker.com', 'caddyserver.com']);
const blocks = (body) => [...body.matchAll(/^```(bash|dotenv)\n([\s\S]*?)\n```$/gm)]
  .map((match) => ({ language: match[1], code: match[2] }));
const links = (body) => [...body.matchAll(/\]\(([^)]+)\)/g)].map((match) => match[1]);
const split = (content) => {
  const match = content.match(/^---\n([\s\S]+?)\n---\n([\s\S]+)$/);
  assert.ok(match, 'YAML frontmatter and article body are required');
  const fields = Object.fromEntries([...match[1].matchAll(/^(\w+): "([^"\n]+)"$/gm)]
    .map((entry) => [entry[1], entry[2]]));
  return { fields, body: match[2] };
};

for (const [lang, content] of Object.entries(articles)) {
  const { fields, body } = split(content);

  test(`${lang}: complete native article and eight installation steps`, () => {
    for (const key of ['title', 'publishedAt', 'author', 'summary']) assert.ok(fields[key], key);
    assert.equal(fields.publishedAt, '2026-09-24');
    assert.equal(fields.author, 'Livvux');
    assert.ok(fields.summary.length >= 80 && fields.summary.length <= 220);
    assert.ok(body.split(/\s+/).length > 2000, 'Both languages need a full walkthrough');
    assert.deepEqual([...body.matchAll(/^## (\d)\./gm)].map((m) => Number(m[1])), [1, 2, 3, 4, 5, 6, 7, 8]);
    assert.doesNotMatch(body, /^# /m, 'The page supplies the h1');
    assert.equal((body.match(/^```/gm) ?? []).length % 2, 0);
    assert.doesNotMatch(body, /<script|<iframe|dangerouslySetInnerHTML|sandbox:||utm_source/i);
    assert.doesNotMatch(body, /^import\s|^export\s/m);
  });

  test(`${lang}: primary sources resolve structurally and hosted link stays discreet`, () => {
    const definitions = [...body.matchAll(/^\[\^([^\]]+)\]: (.+)$/gm)];
    const ids = definitions.map((m) => m[1]);
    assert.equal(ids.length, 12);
    assert.equal(new Set(ids).size, ids.length);
    const prose = body.replace(/^\[\^[^\]]+\]: .+$/gm, '');
    const used = [...new Set([...prose.matchAll(/\[\^([^\]]+)\]/g)].map((m) => m[1]))];
    assert.deepEqual(used.sort(), [...ids].sort());
    const targets = links(body);
    assert.equal(targets.filter((url) => url === 'https://pfotenweb.de/').length, 1);
    for (const target of targets) {
      if (target.startsWith('/')) {
        assert.equal(target, `/blog/animal-rescue-websites${lang === 'de' ? '/de' : ''}`);
      } else {
        const url = new URL(target);
        assert.equal(url.protocol, 'https:');
        assert.ok(sourceHosts.has(url.hostname), target);
        assert.equal(url.search, '', 'No tracking parameters or credentials');
        assert.equal(url.username + url.password, '');
        assert.doesNotMatch(target, /tierschutzhomepage/);
      }
    }
    assert.match(body, lang === 'de' ? /mein eigenes Projekt/ : /my own project/);
    assert.match(body, lang === 'de' ? /keine veröffentlichte Pfotenweb-Mindestanforderung/ : /not published Pfotenweb minimum requirements/);
  });

  test(`${lang}: copyable examples are syntax-valid and preserve safe defaults`, () => {
    const examples = blocks(body);
    assert.ok(examples.length >= 15);
    for (const { language, code } of examples) {
      if (language !== 'bash') continue;
      const result = spawnSync('bash', ['-n'], { input: code, encoding: 'utf8', timeout: 5000 });
      assert.equal(result.error, undefined);
      assert.equal(result.status, 0, result.stderr);
      assert.doesNotMatch(code, /compose down|system prune|volume rm|ufw disable|chmod 777|git reset --hard|git clean|curl[^\n]*\|\s*(?:sudo\s+)?(?:sh|bash)/);
    }
    const commands = examples.map(({ code }) => code).join('\n');
    assert.match(commands, /git checkout v1\.0\.1/);
    assert.doesNotMatch(commands, /git checkout main|git pull/);
    assert.match(commands, /chmod 600 \.env/);
    assert.match(commands, /config --quiet/);
    assert.equal((commands.match(/openssl rand -hex 32/g) ?? []).length, 2);
    assert.match(commands, /trap 'sudo docker compose start app' EXIT/);
    assert.match(commands, /pg_dump[^\n]+database\.dump/);
    assert.match(commands, /\/data\/uploads[^\n]+uploads\.tar\.gz/);
    assert.match(commands, /scp -r SERVER_USER@SERVER_IP/);
    assert.match(commands, /Suites: noble/);
    assert.doesNotMatch(commands, /import_archives|IMPORT_ARCHIVE_DIR/, 'No unreleased volume in the v1.0.1 recipe');
    const env = examples.find((b) => b.language === 'dotenv')?.code;
    assert.ok(env);
    assert.match(env, /^POSTGRES_PASSWORD=PASTE_FIRST_RANDOM_VALUE$/m);
    assert.match(env, /^INITIAL_ADMIN_PASSWORD=PASTE_SECOND_RANDOM_VALUE$/m);
    assert.match(env, /^SITE_URL=https:\/\/tierheim\.example\.org$/m);
    assert.match(env, /^DOMAIN=tierheim\.example\.org$/m);
  });

  test(`${lang}: real UI, release and backup boundaries remain explicit`, () => {
    for (const path of ['/admin/verein', '/admin/tiere/neu', '/admin/aktuelles/neu', '/admin/anfragen', '/admin/team']) {
      assert.ok(body.includes(path), path);
    }
    for (const label of ['Vermittelbar', 'Reserviert', 'Vermittelt', 'Tier anlegen', 'Veröffentlicht (öffentlich sichtbar)', 'Redaktion', 'Verantwortlich']) {
      assert.ok(body.includes(label), label);
    }
    assert.match(body, /5432/);
    assert.match(body, /3000/);
    assert.match(body, /Exited \(0\)/);
    assert.match(body, lang === 'de' ? /v1\.0\.1 importiert nur Archivformat 1/ : /v1\.0\.1 only imports archive format 1/);
    assert.match(body, lang === 'de' ? /keine neue produktive Serverinstallation/ : /not a claim that a new production deployment/);
    assert.match(body, lang === 'de' ? /richtet keinen Zeitplan ein/ : /does not set up a schedule/);
    assert.match(body, /docker compose down -v/, 'The prose must warn about deleting volumes');
  });
}

test('translations contain identical executable examples and source targets', () => {
  assert.deepEqual(blocks(articles.en), blocks(articles.de));
  const external = (body) => links(body).filter((url) => !url.startsWith('/')).sort();
  assert.deepEqual(external(articles.en), external(articles.de));
});

test('source notes keep checks separate from a real server deployment', () => {
  const notes = read('docs/pfotenweb-self-hosting-article-sources.md');
  assert.match(notes, /2026-09-24/);
  assert.match(notes, /v1\.0\.1/);
  assert.match(notes, /not a Pfotenweb deployment test/);
  assert.match(notes, /unbenchmarked editorial/);
});

// Optional integration mode uses the real local production build, not HTML fixtures.
if (process.env.ARTICLE_BASE_URL) {
  const base = new URL(process.env.ARTICLE_BASE_URL);
  if (!['localhost', '127.0.0.1'].includes(base.hostname)) throw new Error('Use a local article server');
  const get = async (path) => {
    const response = await fetch(new URL(path, base), { signal: AbortSignal.timeout(30000) });
    assert.equal(response.status, 200, path);
    return response.text();
  };
  for (const [lang, content] of Object.entries(articles)) {
    test(`${lang}: production route, metadata, translation and safe external links`, async () => {
      const route = `/blog/${slug}${lang === 'de' ? '/de' : ''}`;
      const html = await get(route);
      const { fields } = split(content);
      assert.equal((html.match(/<h1\b/g) ?? []).length, 1);
      assert.ok(html.includes(fields.title));
      assert.ok(html.includes(fields.summary));
      const article = html.match(/<article\b[^>]*>([\s\S]+?)<\/article>/)?.[1];
      assert.ok(article);
      assert.match(article, /data-footnotes/);
      assert.doesNotMatch(article, /\[\^|sandbox:|/);
      for (const href of ['https://pfotenweb.de/', 'https://github.com/Livvux/pfotenweb']) {
        const tag = [...article.matchAll(/<a\b[^>]*>/g)].map(([value]) => value)
          .find((value) => value.includes(`href="${href}"`));
        assert.ok(tag, href);
        assert.match(tag, /target="_blank"/);
        assert.match(tag, /rel="[^"]*noopener/);
      }
      const tags = [...html.matchAll(/<link\b[^>]*>/gi)].map(([tag]) =>
        Object.fromEntries([...tag.matchAll(/([a-z-]+)="([^"]*)"/gi)].map((m) => [m[1].toLowerCase(), m[2]])));
      assert.ok(tags.some((tag) => tag.rel === 'canonical' && tag.href === `https://livvux.dev${route}`));
      for (const [locale, suffix] of [['en', ''], ['de', '/de']]) {
        assert.ok(tags.some((tag) => tag.rel === 'alternate' && tag.hreflang === locale
          && tag.href === `https://livvux.dev/blog/${slug}${suffix}`));
      }
      assert.ok(html.includes(`href="/blog/${slug}${lang === 'en' ? '/de' : ''}"`));
      await get(`/blog/animal-rescue-websites${lang === 'de' ? '/de' : ''}`);
    });
  }
  test('blog index includes the English article', async () => {
    assert.ok((await get('/blog')).includes(`href="/blog/${slug}"`));
  });
}
