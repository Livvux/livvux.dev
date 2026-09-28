# Jev article: source and verification notes

Checked: 2026-09-28. Slug: `jev-ai-fast-decisions`. Both translations use the same evidence and distinguish published measurements from illustrative arithmetic. No paid Jev calls, fresh latency benchmark, or browser-agent experiment was performed for this article.

## Primary sources

- https://docs.typesafe.ai/introduction and https://docs.typesafe.ai/concepts/system-one — decision-model interface; no free-form generation; calibration is not per-answer correctness.
- https://typesafe.ai/blog/introducing-system-one-models-and-jev — September 15 launch, 70–500 ms range, 193.6×/444.6× headline, upper-end and West Coast measurement caveats.
- https://evals.typesafe.ai/ — four workflows, reference labels from model consensus rather than independently established ground truth, reasoning-setting differences. No general accuracy or speed ranking is claimed.
- https://spring.io/blog/2026/09/21/spring-ai-typesafe-structured-judgment/ — implementation author's reported median 275 ms for one question, 310 ms for three; not measured by this article's author.
- https://docs.typesafe.ai/primitives, https://docs.typesafe.ai/primitives/choice and https://docs.typesafe.ai/patterns/fan-out — Choice/Score/Noul, constrained options, independent parallel questions. Dependent questions still need another step.
- https://docs.typesafe.ai/introduction/machine-learning-primer and https://docs.typesafe.ai/confidence — RLCD training objective, confidence derived from distributions; Noul has no separate confidence field.
- https://docs.typesafe.ai/cookbooks/parallel_questions — current detailed table: 0.27 s/$0.000497 batched versus 2.71 s/$0.006090 sequential, five runs. The documentation overview has different rounded speedup summaries; the article uses the detailed cookbook, not those summaries. This is Jev versus Jev, not versus an LLM.
- https://github.com/browser-use/jev-ultrafast — README inspected via connected GitHub, blob `fa7d079f9192f8ad47d4016c0d534cfe72207f33`. 7,073 ms demonstration starts after initial observation, includes generated text and waits, does not book a flight. Narrow MVP evidence, not a broad benchmark.
- https://docs.typesafe.ai/models and https://docs.typesafe.ai/model-jaggedness/jev-1.13 — current Jev 1.13, price, text-only input, strongest English performance, documented numerical and adversarial weaknesses.

## First-party implementation example

The internal-link-checker section is grounded in this repository's `docs/internal-links.md`, `src/lib/internal-links/provider.mjs`, and the tool-page search results read on 2026-09-28. The implementation documentation describes crawled candidates, source sentences and anchor spans, advisory judgments and no automatic website edits. The article links to `/tools/internal-links` but does not claim a fresh live-site verification or performance result. No credentials or private operational details are included.

## Original reasoning and examples

The twenty-step agent comparison is arithmetic, not a benchmark: 20 × 2 s = 40 s; 20 × 0.2 s = 4 s. The model-cost illustration is 1,000,000 requests × 1,000 billable input tokens ÷ 1,000,000 × $0.042 = $42, excluding other costs. The tutorial/prerequisite example is hypothetical. The author's interpretation of why latency changes product design is opinion, not a measured adoption claim.

No generated images, copied benchmark graphics, tracking embeds, application dependencies, or API integrations are added.
