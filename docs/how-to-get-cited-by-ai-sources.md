# How to get cited by AI: editorial source record

Research checked: 2026-10-06.

Articles:

- `content/how-to-get-cited-by-ai/en.mdx`
- `content/how-to-get-cited-by-ai/de.mdx`

## Scope and evidence

This is a practical tutorial based on primary provider documentation. The question selection, editorial templates, suggested sampling workload and 30-day schedule are recommendations. ExampleBackup is explicitly fictional. The sample citation percentage is illustrative. The article does not claim that the author performed a citation experiment or measured a performance improvement.

Search discovery, crawl access, indexing, source selection, linked citations, brand mentions and referral visits are distinguished throughout. Direct-URL diagnostics are excluded from the proposed discovery citation rate. Technical errors and retries must be disclosed, and observed before/after changes are not presented as proof of causality.

## Primary sources

| Topic | Source |
| --- | --- |
| ChatGPT crawler controls | [OpenAI crawler reference](https://developers.openai.com/api/docs/bots) |
| Perplexity crawlers and verification | [Perplexity crawler reference](https://docs.perplexity.ai/docs/resources/perplexity-crawlers) |
| Claude crawler controls | [Anthropic crawler reference](https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler) |
| Google AI Search overview | [AI features and your website](https://developers.google.com/search/docs/appearance/ai-features) |
| Current Google AI guidance | [AI optimization guide](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide) |
| Search inclusion setting | [Search generative AI control](https://support.google.com/webmasters/answer/16908024) |
| Google AI visibility reporting | [Generative AI performance report](https://support.google.com/webmasters/answer/16984139) |
| Google crawler scope | [Common crawlers](https://developers.google.com/crawling/docs/crawlers-fetchers/google-common-crawlers) |
| Robots rule selection | [Robots.txt specification](https://developers.google.com/crawling/docs/robots-txt/robots-txt-spec) |
| Indexing and snippet controls | [Robots metadata](https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag) |
| Indexed versus live URL checks | [URL Inspection](https://support.google.com/webmasters/answer/9012289) |
| Sitemap processing | [Sitemaps report](https://support.google.com/webmasters/answer/7451001) |
| JavaScript rendering | [JavaScript SEO basics](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics) |
| Internal links | [Crawlable link guidance](https://developers.google.com/search/docs/crawling-indexing/links-crawlable) |
| Editorial metadata | [Article structured data](https://developers.google.com/search/docs/appearance/structured-data/article) |
| Language versions | [Localized versions](https://developers.google.com/search/docs/specialty/international/localized-versions) |
| Bing discovery and directives | [Bing Webmaster Guidelines](https://www.bing.com/webmasters/help/webmaster-guidelines-30fba23a) |
| Bing citation reporting | [AI Performance introduction](https://blogs.bing.com/webmaster/2026/2/Introducing-AI-Performance-in-Bing-Webmaster-Tools-Public-Preview/) |
| Bing reporting additions | [June 2026 preview](https://blogs.bing.com/search/2026/6/New-AI-Visibility-Insights-in-Bing-Webmaster-Tools-Intents-Topics-Citation-Share-Compare/) |
| Update notifications | [IndexNow FAQ](https://www.indexnow.org/faq) |
| Firewall precedence | [Cloudflare AI Crawl Control and WAF](https://developers.cloudflare.com/ai-crawl-control/configuration/ai-crawl-control-with-waf/) |
| Served crawler preferences | [Cloudflare managed robots.txt](https://developers.cloudflare.com/bots/additional-configurations/managed-robots-txt/) |
| Optional documentation navigation | [llms.txt proposal](https://llmstxt.org/) |

## Maintenance notes

Use the current Search Console Help pages for the inclusion setting and dedicated report. The older Google AI overview still describes ordinary Web performance reporting. Preserve the newer report's availability caveat instead of promising visible data for every property.

Keep Bing's preview status and supported-surface scope when updating the measurement section. Verify provider-specific crawler and combined-directive behavior before changing the example policy.

The two language versions retain identical source URLs, code behavior, anchor IDs and measurement definitions. Related blog links use each language's existing route convention.

## Integration

Both pages use the existing MDX collection, language routing, metadata, social cards, sitemap integration and copyable code component. Explicit heading IDs support the local table of contents without requiring a heading plugin.

Existing `Sitemap and SEO` and `External links` pull-request workflows cover `content/**`, compile the MDX during production builds and validate rendered site output. No article-specific test or new workflow is introduced.
