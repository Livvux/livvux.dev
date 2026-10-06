# How to Get Cited by AI — editorial research

Checked on **6 October 2026** for:

- `content/how-to-get-cited-by-ai/en.mdx`
- `content/how-to-get-cited-by-ai/de.mdx`

The public articles contain source links alongside the relevant claims. These notes record the research boundary and help future editors identify documentation that changed during 2026. No website configuration, webmaster account or live citation experiment was changed or run for this article.

## Primary sources

| Source | Used for |
| --- | --- |
| [OpenAI: Crawlers](https://developers.openai.com/api/docs/bots) | Search, training and user-requested access distinctions. |
| [OpenAI: Web search — Sources](https://developers.openai.com/api/docs/guides/tools-web-search#sources) | Consulted URLs versus inline citations. |
| [Anthropic: Crawler guidance](https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler) | Claude agent names and access preferences. |
| [Perplexity: Crawlers](https://docs.perplexity.ai/docs/resources/perplexity-crawlers) | Search agents and user-requested fetching. |
| [Google: Current AI optimization guide](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide) | Search-specific format myths and query fan-out. |
| [Google: Search generative AI control](https://support.google.com/webmasters/answer/16908024) | Effective inclusion setting and inheritance. |
| [Google: Generative AI performance report](https://support.google.com/webmasters/answer/16984139) | Dedicated Search impression reporting. |
| [Google: Technical requirements](https://developers.google.com/search/docs/essentials/technical) | HTTP response, access and indexable content. |
| [Google: robots.txt interpretation](https://developers.google.com/crawling/docs/robots-txt/robots-txt-spec) | Specific groups and wildcard groups. |
| [Google: Robots meta tags](https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag) | Indexing and preview restrictions. |
| [Google: JavaScript SEO](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics) | Rendering and inspection. |
| [Google: Canonical URLs](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls) | Canonical consistency. |
| [Google: Localized pages](https://developers.google.com/search/docs/specialty/international/localized-versions) | Reciprocal language alternatives. |
| [Google: Helpful content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content) | Sourcing, experience and originality. |
| [Google: Article structured data](https://developers.google.com/search/docs/appearance/structured-data/article) | Article identity and dates. |
| [Google: Common crawlers — Google-Extended](https://developers.google.com/crawling/docs/crawlers-fetchers/google-common-crawlers#google-extended) | Product token versus Search inclusion. |
| [Google: Spam policies](https://developers.google.com/search/docs/essentials/spam-policies) | Manipulative publishing and link practices. |
| [Cloudflare: Skip rules](https://developers.cloudflare.com/waf/custom-rules/skip/) | Scoped firewall exceptions. |
| [Microsoft: Content for AI search](https://about.ads.microsoft.com/en/blog/post/october-2025/optimizing-your-content-for-inclusion-in-ai-search-answers) | Provider recommendations on clarity and structure. |
| [Bing: AI Performance launch](https://blogs.bing.com/webmaster/2026/2/Introducing-AI-Performance-in-Bing-Webmaster-Tools-Public-Preview/) | Citation activity and supported experiences. |
| [Bing: June AI visibility expansion](https://blogs.bing.com/search/2026/6/New-AI-Visibility-Insights-in-Bing-Webmaster-Tools-Intents-Topics-Citation-Share-Compare/) | Intents, Topics, Citation Share and Compare. |
| [Bing: The evolving role of the index](https://blogs.bing.com/search/2026/5/Evolving-role-of-the-index-From-ranking-pages-to-supporting-answers/) | Grounding and source support. |
| [Bing: Webmaster Guidelines](https://www.bing.com/webmasters/help/webmaster-guidelines-30fba23a) | Bingbot and content-use directives. |
| [IndexNow: FAQ](https://www.indexnow.org/faq) | Change notifications and indexing limits. |
| [Aggarwal et al.: GEO, version 3](https://arxiv.org/html/2311.09735v3) | Experimental visibility measures; Appendix C.1. |

## Freshness decisions

1. **Use the current Google guide.** The older `/search/docs/appearance/ai-features` page was still retrievable with a December 2025 update date. For 2026 inclusion controls and reporting, use the dedicated current help pages above.
2. **Google participation is a setting to check, not a new mandatory manual signup.** Preserve the distinction between a default and an inherited value when revising the instructions.
3. **Keep reporting scopes separate.** Google impressions, Bing citations, the article's proposed sample rate and website visits have different denominators. Do not combine them into an aggregate visibility score.
4. **Do not freeze crawler IP lists into the article.** Provider documentation links to live lists. Anthropic's current help page includes an official list; older search results claiming otherwise are stale.
5. **Use Cloudflare's own documentation for firewall actions.** Perplexity's retrieved page used an older “Allow” label in its Cloudflare custom-rule instructions. The tutorial uses Cloudflare's current Skip/exception terminology.
6. **Do not infer live ranking effects from the GEO experiment.** The cited paper used supplied files for its Perplexity evaluation. The article deliberately avoids repeating its percentage uplifts as present-day citation expectations.

Bing's Webmaster Guidelines were readable through the official-page search result; direct page retrieval returned its JavaScript shell. The linked page is the canonical guideline URL, not a third-party summary.

## Original examples and editorial choices

The question categories, 20-question workload, three runs per platform/language, documentation-search evaluation, tracking columns and 30-day plan are the author's proposed workflow. They are not provider requirements or an executed benchmark.

The hypothetical calculations are:

- Documentation-search example: 16 successful questions out of 20 under a stated evaluation rule. No observed product result is claimed.
- Citation example: 9 answers containing at least one direct citation out of 60 completed answers = 15% on that sample.

The sample metric counts an answer once even when it contains several links. Completed answers without citations, without search or with unknown search status stay in the denominator; failed runs are reported separately. A separate search-confirmed rate includes only `search_used=yes` answers. This is not the same metric as Bing's Citation Share.

Server-rendered main content is presented as an implementation preference. Google can render JavaScript. The tutorial does not generalize one provider's capabilities or controls to all assistants.

The robots example is for a hypothetical public documentation site. It preserves example path exclusions in the wildcard and specific-agent groups and makes the training opt-out a deliberate owner choice. It does not alter this repository's actual robots configuration.

## Repository integration

- English route: `/blog/how-to-get-cited-by-ai`.
- German route: `/blog/how-to-get-cited-by-ai/de`.
- Existing content collection generates both posts; existing SEO helpers supply canonicals, language alternates, article metadata, sitemap entries and social cards.
- Explicit heading IDs support the linked contents list without a new MDX plugin.
- Code samples use the existing copyable code-block component and supported syntax languages.
- Related links retain the article's language.
- Existing Sitemap/SEO and External links workflows already cover changes under `content/**`; no article-specific workflow or prose-matching tests are added.

## Maintenance trigger

Recheck provider crawler pages, Google's inclusion/report help pages and Bing's AI Performance announcements before making future product-specific edits. Update each translation's editorial date only when the article itself changes meaningfully.
