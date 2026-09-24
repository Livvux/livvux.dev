# Claude Opus 5.5 article: sources and media provenance

Checked: 2026-09-24. Release date: 2026-09-22.

This is source-based commentary, not a hands-on model evaluation. Proposed repository trials are written conditionally in both languages. English and German use the site's existing content collection, translation routing and generated Open Graph cards.

## Primary sources

- Announcement and vendor claims: https://www.anthropic.com/claude-opus-5-5
- Requested live comparison: https://artificialanalysis.ai/models/releases/claude-opus-5-5
- Independent launch analysis and original chart exports: https://artificialanalysis.ai/articles/claude-opus-5-5
- API specifications: https://platform.claude.com/docs/en/models/opus-5-5/overview
- Standard API rates: https://platform.claude.com/docs/en/about-claude/pricing
- Integration caveats: https://platform.claude.com/docs/en/models/opus-5-5/migration-guide
- Benchmark scope and aggregation: https://artificialanalysis.ai/methodology/intelligence-benchmarking

The text distinguishes vendor default-workload savings, token unit prices and independently measured max-effort task costs. Dashboard numbers are a dated snapshot, not live data. Default fallback is explicitly retained in the comparison. No claim of universal superiority, guaranteed savings or a personal benchmark is made.

## Original chart assets

These exact image URLs were linked by Artificial Analysis's accompanying launch article, in order:

1. https://cdn.sanity.io/images/6vfeftx9/articles/7fd5f0b59acb7f47a13db71f4e07a06763d9186a-2008x2005.png
2. https://cdn.sanity.io/images/6vfeftx9/articles/77c818c26ed8d618c0cdd3cd54b8a12194cbf883-2008x1176.png

Each displayed image uses the publisher's `?auto=format&w=1200` variant, links to the full-resolution original, and has intrinsic dimensions, localized alternative text and a visible source caption. The responsive image is not a live dashboard embed. The requested interactive release dashboard is linked alongside it. No chart was synthesized, traced, cropped, translated or relabeled.

Images remain on the publisher's CDN. Their copyright remains with Artificial Analysis; they are not covered by this repository's MIT license. This change does not assert a separate redistribution license or publisher endorsement. No third-party script or iframe is added. Native images use `referrerPolicy="no-referrer"`, but visitors still connect to the publisher's CDN when an image loads.

The source image links were identified from the publisher page. A decoded-image visual inspection was not available in the authoring environment. The opt-in network checks validate availability, MIME type, raster signature and (for PNG) aspect ratio; these checks are not a claim of visual review. Review the full-size charts when approving publication. Source links and the accessible numerical table remain useful if the external CDN changes.

## Validation

Run source-only checks without dependencies or network access:

```sh
node --test tests/claude-opus-5-5-article.test.mjs
```

After installing the existing lockfile, build with `pnpm build`, start with `pnpm start`, then check the real routes and original media:

```sh
ARTICLE_BASE_URL=http://localhost:3000 ARTICLE_CHECK_REMOTE_IMAGES=1 node --test tests/claude-opus-5-5-article.test.mjs
```

The path-scoped pull request workflow performs these checks. It does not merge or deploy. Article URLs after merge and deployment are `/blog/claude-opus-5-5` and `/blog/claude-opus-5-5/de`.
