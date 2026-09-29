# Sitemap and crawler discovery

The site serves **https://livvux.dev/sitemap.xml** through the native Next.js
metadata route in `src/app/sitemap.ts`. `src/app/robots.ts` serves `/robots.txt`
and advertises that sitemap. Do not add a competing file under `public/`.

## URL policy

- Include the homepage, blog index, tools index, internal-link checker, and
  crawler information page.
- Derive post URLs from the compiled `allPosts` collection and existing
  `hrefFor`/`findPost` helpers: English `/blog/<slug>`, German `/blog/<slug>/de`.
- Include both real translations, with reciprocal and self-inclusive EN/DE
  `hreflang` links. Do not invent a translation for a single-language post.
- Use the canonical HTTPS origin from `DATA.url`, encode URL path segments,
  deduplicate entries, and keep output sorted.
- Exclude API routes, redirect aliases, Open Graph image endpoints, assets,
  query strings, fragments, and content paths the page resolver cannot serve.
  The current collection has no draft/scheduling feature: this sitemap follows
  what the page resolver actually serves, not a separate publication policy.
- Public pages and rendering assets remain crawlable. `/api/` is disallowed in
  robots.txt; robots.txt is a crawl preference, **not access control**.

## Dates and updates

For a post, `lastmod` uses `updatedAt` when supplied, otherwise `publishedAt`.
These must be real editorial dates. Update `updatedAt` after a significant
content change, not merely after a deployment. Use `YYYY-MM-DD` or an ISO/W3C
timestamp with an explicit timezone. Invalid dates are omitted, not guessed.
Static pages omit `lastmod` because they have no reliable editorial timestamps.
There are no filesystem/build timestamps, `priority`, or `changefreq` values.

Next.js generates and caches these metadata routes as part of the build. New
posts and updated frontmatter are reflected after the next build/deployment;
there is no hand-maintained XML file or runtime crawl of the website. When adding
an indexable static page, update `staticPaths` and the expected static paths in
the tests. A future draft/noindex/scheduling feature must use the same visibility
policy for pages, post listings, and this sitemap.

## Validation and deployment

```sh
pnpm install --frozen-lockfile
node --test tests/sitemap.test.mjs
pnpm exec eslint src/app/sitemap.ts src/app/robots.ts tests/sitemap.test.mjs
pnpm build
pnpm start
# In another terminal (Python 3 required):
SITEMAP_BASE_URL=http://127.0.0.1:3000 python3 tests/sitemap.integration.py
```

The Sitemap workflow runs the unit tests and a complete production build. It then
parses the actual XML, checks it against the content files, verifies language
alternates, and requests every listed page without following redirects. Pages
must return HTML with HTTP 200, must not be noindex, and must agree with any
explicit canonical. The check also verifies robots.txt and sitemap size limits.

After merging and deploying, submit `https://livvux.dev/sitemap.xml` in the
verified site's Google Search Console Sitemaps report (and Bing Webmaster Tools,
if used). This is a separate manual action; the PR does not submit anything to
search engines. Discovery or submission does not guarantee indexing.

Keep a single sitemap while below **50,000 URLs and 50 MB uncompressed**. Split
it and add a sitemap index if the site outgrows either limit; the integration
check fails instead of silently allowing an oversized sitemap.

## References

- [Next.js sitemap metadata route](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap)
- [Next.js robots metadata route](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots)
- [Google sitemap best practices](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)
- [Google localized-page annotations](https://developers.google.com/search/docs/specialty/international/localized-versions)
