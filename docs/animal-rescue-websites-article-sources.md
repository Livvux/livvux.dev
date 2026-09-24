# Animal rescue websites — editorial and source notes

Prepared: 24 September 2026.

## Requested basis and scope

The supplied `Website für Tierschutzvereine.docx` provides the starting argument:
current animal profiles, a maintainable website, social media as a complement rather
than a replacement, clear contact routes, and a dedicated Pfotenweb option. The
user requested a technical expansion in German and English, not a transcription.
Neither the attachment nor its embedded screenshots is committed to this repository.

The user explicitly requested the first-person recommendations: disclose Pfotenweb
as the author's own project; recommend Astro or WordPress for a self-managed build;
do not recommend Jimdo or other general-purpose builders for this use case. The
adopter-experience, follow-up, authenticity and restrained-design priorities also
come from that brief. The builder recommendation is framed as editorial judgment,
not a benchmark or an unsupported claim about every competing product.

The existing `content/technology-animal-welfare/{en,de}.mdx` article covers the
Facebook-to-website automation background. This new article links to the appropriate
language route and focuses on website planning, content, maintainability and trust.
It does not claim to have implemented changes in Pfotenweb itself.

## Product evidence and limitations

Pfotenweb's limited product description (website, animal profiles, content, inquiries,
mobile editing) is supported by the supplied article and the user-supplied homepage
copy dated 24 September 2026. A fresh retrieval of the live homepage was attempted
but failed in the research environment. This is not a live performance audit.
No current price, capacity, uptime, legal-compliance or speed claim is made.
The article links to https://pfotenweb.de/ for the current product offering and
identifies the author's ownership before the first recommendation.

The TypeScript model, publishing checks, cache refresh, separate private records,
backup/restore checks and post-adoption follow-up are proposed design choices,
not Pfotenweb implementation claims. No particular framework is claimed to power
Pfotenweb. No new application feature is added by this article PR.

No adopter quotes, case studies, conversion figures or ranking results were invented.
The article recommends collecting genuine, approved accounts, keeping support
independent from publicity, and making publication optional. No legal-compliance
assessment or animal-health advice is offered.

## Technical primary sources

The following official documentation was read for the technical expansion:

- https://docs.astro.build/en/concepts/islands/ — HTML-rendered Astro components and
  selective interactive islands. This does not mean every Astro website sends no JavaScript.
- https://docs.astro.build/en/guides/content-collections/ — structured content, schemas,
  build-time collections, live collections, and the distinction between build-time
  freshness and request-time retrieval.
- https://developer.wordpress.org/plugins/post-types/registering-custom-post-types/ —
  custom post types and keeping registration in a plugin rather than the theme.
- https://developer.wordpress.org/advanced-administration/performance/optimization/ —
  caching options. No historical speed multipliers or outdated tuning examples are reused.
- https://web.dev/articles/browser-level-image-lazy-loading — explicit image dimensions;
  lazy loading below the initial viewport, not for the important above-the-fold image.
- https://web.dev/articles/vitals — LCP at most 2.5 seconds, INP at most 200 milliseconds,
  CLS at most 0.1, assessed at the 75th percentile separately for mobile and desktop.
  These are reference targets, not measurements of any platform in this article.
- https://www.w3.org/WAI/tutorials/forms/ — labels, feedback, validation guidance, and
  asking only for information needed by the form's task.

The linked recommendations about credibility, human support, editorial ownership,
minimal UI and operational acceptance are the author's proposed approach, not
empirically measured causal effects.

## Integration and verification

Files follow the existing `content/<slug>/{en,de}.mdx` convention and frontmatter
schema. No application routes, dependencies, styling or external embeds are changed.
The existing blog renderer supplies the title, translation switch, canonical and
language alternates, and generated Open Graph images.

Run the source checks with:

```sh
node --test tests/animal-rescue-websites-article.test.mjs
```

The scoped pull-request workflow also builds the site with the existing frozen
lockfile, runs TypeScript checking, starts the production server locally and checks
both article routes, their language links, canonical metadata, rendered footnotes,
the existing related article routes and the blog index. The HTTP checks require
`ARTICLE_BASE_URL` and reject non-local hosts. Passing source checks alone is not a
claim that a production build or browser layout inspection was performed.
