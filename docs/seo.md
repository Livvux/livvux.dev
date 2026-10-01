# SEO maintenance

## URL and content invariants

- Keep the published routes: English `/blog/<id>`, German `/blog/<id>/de`. Existing German-slug permanent redirects remain intact.
- Every indexable page has its own absolute canonical URL. Archive page 2 canonicalizes to `/blog?page=2`, not page 1. Tracking parameters are not canonical. `?page=1` and leading-zero aliases redirect; malformed and out-of-range pages are not indexable.
- Archive pagination is rendered as ordinary anchor links, including numbered pages. The sitemap intentionally lists article and static URLs, not query-string archives; all archive pages are discoverable through links.
- Translated articles advertise only existing, reciprocal EN/DE alternates. HTML also specifies `x-default` for the English version. The sitemap retains its existing self-inclusive EN/DE alternates; `x-default` is optional.
- The shared site chrome remains English. German article `main` and `article` elements explicitly declare `lang="de"`, and metadata, article navigation and date labels are localized. No JavaScript-only language switching, new URL migration, or dynamic root layout is required.
- Article metadata and JSON-LD use the same editorial dates as the sitemap. Set `updatedAt` only after a meaningful edit to that translation. Never replace dates with build time. Invalid explicit update dates are omitted rather than silently falling back. Review chronology before publishing.
- `author` defaults to the site owner, but an explicit guest author is not linked to the owner's profile. Supply a useful `summary` and descriptive title for every translation. An optional `image` can be root-relative or an absolute HTTP(S) URL; otherwise the existing generated article card is used.

## Structured data and discoverability

`src/lib/seo.ts` owns page/article metadata, URL handling, date validation and JSON-LD builders. Structured data is escaped before insertion into script elements.

The site publishes WebSite and Person entities, article BlogPosting data, visible breadcrumbs with matching BreadcrumbList data, archive CollectionPage/ItemList data and a WebApplication description for the internal-link tool. It does not invent reviews, ratings, offers, or a site SearchAction. Tool copy and schema explicitly retain the bring-your-own-key/provider-fee distinction.

The homepage has a semantic, server-rendered H1 and links to recent posts and tools. The blog archive no longer hides its content behind entrance animations. Article suggestions and previous/next links stay in the current article's language. The homepage portrait uses Next Image with intrinsic dimensions and preload. These are implementation changes, not a measured Core Web Vitals or Lighthouse score claim.

The existing sitemap and robots rules remain unchanged. API responses additionally receive `X-Robots-Tag: noindex, nofollow`. This is defense in depth, not authentication, and blocked URLs may not be crawled to observe the header. Public HTML and rendering assets are not blocked.

## Deployment settings

Optional **build-time** environment variables:

| Variable | Purpose |
| --- | --- |
| `GOOGLE_SITE_VERIFICATION` | Actual HTML verification token supplied by Google Search Console; omit until available. |
| `BING_SITE_VERIFICATION` | Actual Bing Webmaster Tools verification token; omit until available. |
| `SEO_NOINDEX=true` | Mark a non-production build noindex. Leave unset for production. |

Vercel preview builds also receive noindex automatically through `VERCEL_ENV=preview`. For other hosts, explicitly set `SEO_NOINDEX=true` on preview builds. Rebuild when changing these values; do not promote a preview build with noindex to production. Canonicals always use the configured production origin in `DATA.url`.

## Validation

Use the pinned package manager and existing lockfile:

```sh
pnpm install --frozen-lockfile
node --test tests/sitemap.test.mjs tests/seo.test.mjs
pnpm build
pnpm exec tsc --noEmit
pnpm start
# In another terminal, with the production server running:
SITEMAP_BASE_URL=http://127.0.0.1:3000 python3 tests/sitemap.integration.py
SEO_BASE_URL=http://127.0.0.1:3000 python3 tests/seo.integration.py
```

The `Sitemap and SEO` workflow runs these checks plus targeted ESLint. Unit tests execute the real helpers and page metadata with isolated fixtures. Production tests request every sitemap page, inspect rendered canonical/social/language/schema data, traverse archive pagination, and verify invalid URLs, normalized aliases and API headers. They do not substitute for browser interaction, accessibility, external image availability or field-performance testing.

## After deployment

1. Confirm the production homepage, representative EN/DE articles, `/blog?page=2`, `/robots.txt` and `/sitemap.xml` return their intended responses. Verify no production noindex header/meta, no login or Cloudflare challenge for crawlers, and working share images. Preserve HTTP-to-HTTPS and www-to-canonical redirects at the hosting/CDN layer without redirect chains.
2. Verify the actual domain property in Google Search Console and Bing Webmaster Tools. Submit `/sitemap.xml`, inspect representative URLs and review crawl/indexing errors. This code does not create accounts, submit sitemaps or request indexing on your behalf.
3. Check representative articles in the Rich Results Test and inspect real mobile/desktop performance in PageSpeed Insights/Search Console. Review article accuracy, search intent, uniqueness, descriptive image alt text and contextual links editorially.

No code change guarantees indexing, rich results or rankings. Search-engine decisions, content quality, references/backlinks, hosting behavior and field performance still require review.

## Primary documentation

- Google pagination: https://developers.google.com/search/docs/specialty/ecommerce/pagination-and-incremental-page-loading
- Google localized versions: https://developers.google.com/search/docs/specialty/international/localized-versions
- Google article structured data: https://developers.google.com/search/docs/appearance/structured-data/article
- Next.js metadata and shallow merging: https://nextjs.org/docs/app/api-reference/functions/generate-metadata
