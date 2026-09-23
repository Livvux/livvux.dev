import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const slug = 'cloudflare-quick-tunnels-one-command';
const imagePath = 'public/images/blog/cloudflare-quick-tunnels/whatsapp-preview.webp';
const image = readFileSync(new URL(imagePath, root));
const command = 'cloudflared tunnel --url http://localhost:3000';
const read = (path) => readFileSync(new URL(path, root), 'utf8');
const sourceHosts = new Set([
  'try.cloudflare.com', 'developers.cloudflare.com', 'blog.cloudflare.com',
  'vite.dev', 'nextjs.org',
]);

for (const lang of ['en', 'de']) {
  const content = read(`content/${slug}/${lang}.mdx`);

  test(`${lang}: complete frontmatter and balanced content structure`, () => {
    const match = content.match(/^---\n([\s\S]+?)\n---\n/);
    assert.ok(match, 'MDX frontmatter is required');
    for (const key of ['title', 'publishedAt', 'author', 'summary']) {
      assert.match(match[1], new RegExp(`^${key}: "[^"\\n]+"$`, 'm'));
    }
    assert.match(match[1], /^publishedAt: "2026-09-23"$/m);
    assert.match(match[1], /^author: "Livvux"$/m);
    assert.equal((content.match(/^```/gm) ?? []).length % 2, 0);
    assert.equal((content.match(/<figure>/g) ?? []).length, 1);
    assert.equal((content.match(/<\/figure>/g) ?? []).length, 1);
    assert.doesNotMatch(content, /^# /m, 'The page renders the title, not a second h1');
    assert.doesNotMatch(content, /<script|<iframe|dangerouslySetInnerHTML/);
  });

  test(`${lang}: copyable commands keep installation, local server and tunnel separate`, () => {
    const blocks = [...content.matchAll(/```bash\n([\s\S]*?)\n```/g)].map((m) => m[1]);
    assert.deepEqual(blocks, [command, 'brew install cloudflared', 'pnpm dev', command]);
    assert.match(content, /`Ctrl\+C`/);
    assert.match(content, /port `3000`|Port `3000`/);
    assert.match(content, /awake and connected|wach und mit dem Internet verbunden/);
    assert.match(content, /new random address|neue zufällige Adresse/);
  });

  test(`${lang}: published limits and public-access caveat are explicit`, () => {
    assert.match(content, /200 concurrent in-flight requests|200 gleichzeitig laufende Anfragen/);
    assert.match(content, /HTTP `429`/);
    assert.match(content, /No Server-Sent Events \(SSE\)|Keine Server-Sent Events \(SSE\)/);
    assert.match(content, /No uptime guarantee or SLA|Keine garantierte Verfügbarkeit oder SLA/);
    assert.match(content, /A random URL is not a password|Eine zufällige URL ist kein Passwort/);
    assert.match(content, /not an upload to permanent hosting|kein Upload auf ein dauerhaftes Hosting/);
    assert.match(content, /not silently added|nicht automatisch/);
    assert.match(content, /`502`/);
    assert.match(content, /`7844`/);
    assert.match(content, /\.cloudflared\/config\.yaml/);
    assert.match(content, /allowedDevOrigins/);
    assert.match(content, /server\.allowedHosts/);
  });

  test(`${lang}: source links, real local image and localized related article`, () => {
    const urls = [...content.matchAll(/\]\((https:\/\/[^)]+)\)/g)].map((m) => new URL(m[1]));
    assert.ok(urls.length >= 10, 'Technical sections need inline source links');
    for (const url of urls) assert.ok(sourceHosts.has(url.hostname), url.href);
    assert.ok(urls.some((url) => url.hostname === 'try.cloudflare.com'));
    assert.ok(urls.some((url) => url.pathname.endsWith('/trycloudflare/')));
    assert.ok(urls.some((url) => url.pathname.endsWith('/downloads/')));
    assert.ok(urls.some((url) => url.pathname.endsWith('/tunnel-with-firewall/')));
    const images = [...content.matchAll(/<img\b[^>]*\/>/g)];
    assert.equal(images.length, 1);
    assert.match(images[0][0], /src="\/images\/blog\/cloudflare-quick-tunnels\/whatsapp-preview\.webp"/);
    assert.match(images[0][0], /alt="[^"]{40,}"/);
    assert.match(images[0][0], /width="800" height="405"/);
    assert.match(images[0][0], /loading="lazy" decoding="async"/);
    assert.match(content, /<figcaption>[\s\S]+?<\/figcaption>/);
    assert.ok(content.includes(`/blog/technology-animal-welfare${lang === 'de' ? '/de' : ''})`));
    assert.doesNotMatch(content, /https:\/\/[a-z0-9-]+\.trycloudflare\.com/,
      'Do not publish the disposable screenshot address as an active link');
    assert.doesNotMatch(content, /imagegen|ghostwriter_images|IMG_0049|cite|turn\d+view/);
  });
}

test('real screenshot asset has the expected WebP bytes', () => {
  assert.equal(image.toString('ascii', 0, 4), 'RIFF');
  assert.equal(image.toString('ascii', 8, 12), 'WEBP');
  assert.equal(image.length, 14400);
  assert.equal(createHash('sha256').update(image).digest('hex'), '200c40f7d2b076dd8d1cb3788c39f082094c1f027215c0561d43fb5b67513276');
});

test('source notes document media edits and the distinction from a live benchmark', () => {
  const notes = read('docs/cloudflare-quick-tunnels-article-sources.md');
  assert.match(notes, /263, 887, 1154, 1338/);
  assert.match(notes, /800.*405/);
  assert.match(notes, /200c40f7d2b076dd8d1cb3788c39f082094c1f027215c0561d43fb5b67513276/);
  assert.match(notes, /No live Quick Tunnel was started/);
  assert.match(notes, /No generated images/);
});

// Optional integration checks against the real built Next.js server, not an HTML fixture.
if (process.env.ARTICLE_BASE_URL) {
  const base = new URL(process.env.ARTICLE_BASE_URL);
  if (!['localhost', '127.0.0.1'].includes(base.hostname)) {
    throw new Error('ARTICLE_BASE_URL must point to a local test server');
  }
  for (const lang of ['en', 'de']) {
    test(`${lang}: production article route renders both language links and image`, async () => {
      const path = `/blog/${slug}${lang === 'de' ? '/de' : ''}`;
      const response = await fetch(new URL(path, base), { signal: AbortSignal.timeout(30_000) });
      assert.equal(response.status, 200);
      const html = await response.text();
      assert.match(html, /<h1[^>]*>Cloudflare Quick Tunnels:/);
      assert.ok(html.includes(`/blog/${slug}/de`));
      assert.ok(html.includes(`/blog/${slug}`));
      assert.ok(html.includes('/images/blog/cloudflare-quick-tunnels/whatsapp-preview.webp'));
      assert.ok(html.includes('try.cloudflare.com'));
    });
  }
  test('production image endpoint serves the exact reviewed WebP', async () => {
    const response = await fetch(new URL(imagePath.replace(/^public/, ''), base), {
      signal: AbortSignal.timeout(10_000),
    });
    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type') ?? '', /image\/webp/);
    assert.deepEqual(Buffer.from(await response.arrayBuffer()), image);
  });
}
