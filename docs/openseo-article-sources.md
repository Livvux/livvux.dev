# OpenSEO article: sources and media provenance

Checked: 2026-09-23. Scope: the EN/DE introduction in
`content/openseo-seo-data-not-subscriptions/`.

## Editorial scope

The article argues that an expensive closed SEO suite is optional, with a positive
focus on OpenSEO. It distinguishes free self-hosted software from paid data,
infrastructure, maintenance and optional AI usage. It does not claim identical
indexes, universal feature parity, a measured saving, a hands-on benchmark, or
that the managed OpenSEO service is subscription-free.

The first-person recommendations express the author's requested perspective.
The example agent prompt is explicitly hypothetical. No customer results or
personal usage history have been invented.

## Primary sources

- Product and source: https://openseo.so/ and https://github.com/every-app/open-seo
- MIT license: https://github.com/every-app/open-seo/blob/main/LICENSE
- Self-hosting / direct DataForSEO billing: https://openseo.so/docs/self-hosting
- Docker default has application authentication disabled: https://openseo.so/docs/self-hosting/docker
- Managed-service subscription: https://openseo.so/pricing
- DataForSEO payment floor: https://dataforseo.com/pricing
- Removal of the former Backlinks / LLM Mentions monthly commitments on July 1, 2026, alongside selected price increases: https://dataforseo.com/update/pricing-update-in-dataforseo-apis
- Keywords: https://openseo.so/features/keyword-research
- Domain research: https://openseo.so/features/domain-overview
- Backlink data: https://openseo.so/backlink-checker
- Rank tracking: https://openseo.so/features/rank-tracking
- Technical audits: https://openseo.so/features/site-audit
- AI visibility: https://openseo.so/features/ai-brand-visibility
- MCP capabilities: https://openseo.so/features/mcp

Sources are linked inline in both articles, not only here. Time-sensitive pricing
claims should be rechecked when updating the article.

## Requested external references

- Directory entry: https://openalternative.co/openseo
- Original X post: https://x.com/ossalternative/status/2102518350178091297

The X post is embedded via the official `platform.twitter.com/widgets.js` widget
and its original numeric ID. It is not reconstructed or quoted from an
unverified transcription. The exact requested permalink is also in both MDX
files. The widget's permanent link fallback uses X's status-ID permalink.

## Real screenshots only

Both image URLs were opened and visually inspected. They are the product
screenshots linked by the official feature pages, not AI-generated images and
not screenshots captured by this article's author. Both languages use the same
unmodified assets, with localized alt text and source captions.

| Screenshot | Publisher's source page | Image URL |
| --- | --- | --- |
| Keyword research, results, trends and SERP panel | https://openseo.so/features/keyword-research | https://imagedelivery.net/ysLOa6bzFaM49Jxok-TAlw/d77077d0-cdf4-4523-0c41-56a7b4861300/public |
| AI Visibility / Brand Lookup report | https://openseo.so/features/ai-brand-visibility | https://imagedelivery.net/ysLOa6bzFaM49Jxok-TAlw/cde3e4f8-079f-4890-cb17-371087107400/public |

These are remote embeds from the publisher's image CDN, following the existing
blog's use of external project imagery. They are not archived local files.
Availability depends on that CDN. No claim is made that the website's media have
a separate unrestricted license. Product imagery remains attributed to OpenSEO.
Images have lazy loading, explicit layout dimensions, descriptive alt text and
`referrerPolicy="no-referrer"`; image requests still reach the publisher's CDN.
Displayed metrics are the publisher's captured examples, not fresh measurements.

No generated PNGs from the earlier conversation are used or committed. No remote
`image` frontmatter is set because this site's metadata currently prepends its
own origin to that field. The existing text-based social-card route is unchanged.

## Tweet behavior

- The official X script loads only after the reader presses the localized load
  button. The notice explains the third-party connection.
- `dnt: true` is requested; this is not a claim that X makes no network requests.
- The widget renders the original post. A direct link remains visible with
  JavaScript off, before opt-in, and if X is blocked or the post is unavailable.
- Script errors, empty widget results, rejected promises and a 15-second timeout
  show a localized fallback message.
- Each render owns a separate DOM target and cleans it up on unmount, including
  navigation between translations and React Strict Mode cleanup.
- No new package, credential or global script is required.

## Validation

Run with the repository's existing TypeScript dev dependency installed:

```sh
node --test tests/openseo-article.test.mjs
pnpm build
```

Executed in the authoring environment: all 10 content / registration / TSX
syntax checks pass. This environment used its preinstalled TypeScript compiler
via `NODE_PATH`. These are deliberately scoped checks, not a full type check,
MDX compilation or browser integration test.

Not executed here: the full Next.js build and live X-widget rendering. The
container could not resolve external hosts to install or fetch the project;
X and its oEmbed endpoint were also unavailable through the research browser.
The official product pages and the two screenshots were inspectable through the
research browser. No OpenSEO account was accessed and no paid data queries ran.

Before merging, run the full build and open both article routes to confirm the
images, EN/DE switch and opt-in widget in an unrestricted browser:

- `/blog/openseo-seo-data-not-subscriptions`
- `/blog/openseo-seo-data-not-subscriptions/de`
