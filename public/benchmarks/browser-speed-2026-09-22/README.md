# Browser speed benchmark — September 22, 2026

This directory preserves the three benchmark files supplied for the bilingual
Obscura vs agent-browser article. No benchmark was rerun while preparing the
article. The original report is an unedited source document; the articles qualify
its broader claims rather than silently changing the source.

## Read the articles

- English: `/blog/obscura-vs-agent-browser-benchmark`
- Deutsch: `/blog/obscura-vs-agent-browser-benchmark/de`

## Files and provenance

| File | Contents | SHA-256 |
| --- | --- | --- |
| `browser-speed-report.json` | Metadata, 20 result rows, individual timings | `542e265d077c429a04569c3baefc80549bda1ceaaf81557952e488daf5e60e47` |
| `browser-speed-report.csv` | The same results in tabular form | `100d95b32b190a3c6a44a337e94930fefe3a726939c4b67533a5ed4c95f61bcb` |
| `browser-speed-report.md` | Original methodology, interpretation and command examples | `229c95e7513afe97c635d5817bb956057bd5eef4c4d69c337642efeca889a313` |

## Interpretation notes

- Twenty result rows are not twenty independent head-to-head tests. The
  agent-browser local batch row repeats the warm sequential baseline exactly.
- The article retains the exported medians. Recomputing two four-run medians
  from rounded individual timings differs by 0.05 ms from the stored medians.
- Raw CDP, separate CLI invocations and one JavaScript evaluation have different
  work boundaries. Ratios describe these paths, not isolated engine performance.
- `/json/version` readiness is not comparable to a full cold navigation,
  extraction and teardown task as an equal browser-startup measurement.
- Stealth latency was measured; bot-detection success rates were not.
- Connection/TLS/cache reuse is the report's explanation, not an isolated
  network-profile result in the uploaded evidence.
- The original `run.py`, `run_ext.py`, `cdp_interactive.py` and fixture files were
  not supplied. This is a results archive, not a complete reproduction harness.
- Agent-browser's official quick-start documentation is linked in both articles
  as product-workflow context only. It is not a source for the benchmark numbers.

## Validate the publication files

From the repository root, with Node.js available:

```sh
node scripts/validate-browser-speed-benchmark.mjs
```

This checks source hashes, JSON/CSV agreement, timing summaries, bilingual
frontmatter, numeric coverage and local download links. It does not run the
benchmark or replace a Next.js build, MDX compilation or browser-rendering test.
