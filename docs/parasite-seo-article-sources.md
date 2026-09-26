# Parasite SEO article: sources and verification

Checked: 2026-09-26.

## Scope and integration

The English and German articles adapt the supplied bilingual Markdown drafts to the repository's existing MDX schema. They live under the shared `parasite-seo-explained` identifier; the existing routing code provides `/blog/parasite-seo-explained` and `/blog/parasite-seo-explained/de`, language switching, canonical URLs and alternate-language metadata. The title is rendered by the page, not repeated as an MDX h1. External Markdown links use the existing content-link handling.

## Original example and media

- Original reference: https://x.com/hridoyreh/status/2103058232218619936/video/1
- The article is based on the screenshot and X excerpts supplied by the user. The video could not be reviewed in full. Its current ranking, traffic, link attributes and income were not independently verified.
- The `#2` annotation is already part of the supplied image. It is not a live ranking claim or a new annotation added for this article.
- Original file: `parasite-seo.jpeg`, 680 x 394 pixels, 37,608 bytes.
- Original SHA-256: `69dbf3808bed68e130ffca47d8a44cf65f1a706eab5030309c75dfdcd2c8434a`.
- Published asset: `public/images/blog/parasite-seo/search-results.webp`, 680 x 394 pixels, 19,862 bytes.
- Published SHA-256: `493a14633714b667346f51f96d1fa0b772613e3ae3592a24af33ff48c7caa6db`.
- Processing: Pillow WebP conversion, quality 75, method 6. No cropping, resizing, redrawing, added text or content changes. Visually checked after conversion. No generated images.
- Attribution to `@hridoyreh` is retained in the image and both captions. Third-party screenshot rights are not reassigned by the repository's code license.
- The X source is a normal link; no third-party widget, tracking script or autoplay video is added.

## Primary references checked for this PR

1. Google Search spam policies: https://developers.google.com/search/docs/essentials/spam-policies
   Distinguishes link spam, site reputation issues and acceptable third-party/editorial publishing. Do not label every third-party article as a violation.
2. August 2026 update: https://developers.google.com/search/blog/2026/08/update-site-reputation-policy
   Published August 28; enforcement distinction effective August 30. It concerns the location of the searcher inside or outside the EEA, not simply the publisher's address. Independent ranking is not a promise of favorable treatment.
3. Ranking systems: https://developers.google.com/search/docs/appearance/ranking-systems-guide
   Primarily page-level evaluation with site-wide signals; a strong host does not make every page rank well.
4. Crawling and indexing: https://developers.google.com/search/docs/fundamentals/how-search-works
   Publication does not guarantee crawling, indexing or appearance in results.
5. Google Sites publishing: https://support.google.com/sites/answer/6372880?hl=en
6. Google Docs publishing: https://support.google.com/docs/answer/183965?hl=en
   Public publishing and ordinary document sharing are distinct. Account restrictions and privacy still matter.
7. Chrome Web Store policies: https://developer.chrome.com/docs/webstore/program-policies
   Supporting spam and abuse policy: https://developer.chrome.com/docs/webstore/program-policies/spam-and-abuse
8. Developer registration: https://developer.chrome.com/docs/webstore/register
   A one-time developer registration fee is documented; no particular fee amount is claimed.
9. Help community rules: https://support.google.com/communities/answer/7425194?hl=en
   The article rejects fabricated support questions and promotional link spam.
10. Medium rules: https://help.medium.com/hc/en-us/articles/213477928-Medium-Rules
    Content primarily intended to send traffic to an external site or manipulate rankings is prohibited. Ordinary self-promotion is not categorically prohibited.
11. Link qualification: https://developers.google.com/search/docs/crawling-indexing/qualify-outbound-links
12. Link-attribute hints: https://developers.google.com/search/blog/2019/09/evolving-nofollow-new-ways-to-identify

The supplied drafts also link to https://ahrefs.com/blog/parasite-seo/ for terminology and platform-dependence context. That secondary reference is retained, but is not used as authority for Google's current rules.

## Claims deliberately not made

No verified earnings, traffic estimates, live SERP positions or Google endorsement are asserted. The 1,000 visits → 100 onward clicks → two sales → $100 calculation is explicitly hypothetical, not a conversion benchmark or a forecast. No Chrome extension was published, no forum message was posted and no backlink placement was purchased.

## Validation

`node --test tests/parasite-seo-article.test.mjs` checks both frontmatter blocks, translated section structure, source links, attribution, limitations and the exact screenshot bytes. The scoped GitHub Actions workflow additionally installs the existing lockfile, builds the full site and runs route, metadata, external-link and image checks against the production Next.js server using `ARTICLE_BASE_URL`.
