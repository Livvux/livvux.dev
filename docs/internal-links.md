# Internal links tool

Route: `/tools/internal-links`. Index: `/tools`. Bot information: `/tools/crawler`.

This is an independent implementation of the workflow and tool-page content supplied by the owner from https://ian.is/tools/internal-links on 2026-09-23. It is not Ian's backend, does not call Ian's endpoints, and does not redistribute his fonts, tracking, visitor data, newsletter, or branding. Private prompts, exact ranking coefficients and the original report renderer were not supplied, so identical results or pixel-identical presentation are not claimed. The existing Livvux shell and theme remain in use.

## What is included

- Required bring-your-own TypeSafe key. No checkout, Stripe, payment tokens, server-owned inference key, or flat-fee report option.
- robots.txt policies, sitemap indexes (including gzip), same-host/www scope, fallback link traversal, 500-page cap, Crawl-delay and canonical consolidation.
- Main-content versus navigation link extraction, actual sentence/anchor spans, generic-anchor audit, page type and search intent classification.
- TF-IDF shortlist of up to eight targets per source; up to four real source sentences and six anchor options per sentence. Existing links, noindex targets, home/legal/hub sources and targets, and about targets are excluded. Pages declaring different languages are not paired.
- Orphan-target boost of 1.35 when contextual inbound source-page count is below three; dated news target multiplier 0.7. Acceptance threshold 0.55. These are this implementation's explicit coefficients, not verified coefficients from Ian's server.
- Seven live counters, stages, feed, latest decision, type distribution, weak-page map, recommendations, pages, generic anchors and existing links. Search, pagination and whole-report CSV/JSON downloads.
- No application persistence of key/page/report content. Report state stays in the tab until navigation/reload. The UI password input is cleared when a run starts. Cancel and disconnect abort ongoing work.

## TypeSafe contract and costs

Verified against https://docs.typesafe.ai/api and https://docs.typesafe.ai/models on 2026-09-23:

- `GET https://api.typesafe.ai/v1/models` validates access before crawling. This endpoint may list only aliases; absence of a version ID does not mean it cannot be used.
- `POST https://api.typesafe.ai/v1/systemone` with Bearer authorization, `model`, `state`, and typed `questions`.
- Pinned model: `jev-1.13.0`. The adapter rejects a different response model. Upgrade the pin deliberately when needed.
- `choice` returns `choice`, `probabilities`, `confidence`; `noul` returns a probability in `noul`. Never parse free-form model output as a link or URL.
- Cost is estimated from reported input tokens at $0.042 per million; output tokens were free at verification. It is not an invoice and does not include account-specific terms or incomplete requests. Review this constant when provider pricing changes.
- Retry 429/529 responses with bounded backoff and Retry-After. 401/403 messages do not expose upstream response bodies or keys.
- TypeSafe receives extracted public-page text. Its own retention/privacy terms apply. Application non-persistence is not a claim that TypeSafe offers zero retention for this account.

Integration verification on 2026-09-23 used a key retrieved privately from 1Password: 31 live livvux.dev pages, 11 suggestions, 83 provider requests, estimated $0.015259314. No credential is stored in the application. Keys are opaque bearer credentials; validation does not assume a provider prefix.

## Runtime and deployment

Requires the Node.js runtime (Node 22 recommended); not an Edge/static-export route. Existing dependency and lock files are unchanged. The integration passed the Next production build, strict type check, repository lint (warnings only), 53 backend tests and Chromium desktop/mobile report tests.

`POST /api/tools/internal-links` streams NDJSON. The request must have the page's Origin (including the fixed HTTPS production origins behind Dokploy) and JSON content type. The runtime requests a maximum duration of 300 seconds; the application aborts after 270 seconds. Hosting plans may impose a shorter ceiling. Configure any reverse proxy to allow the long-lived POST and disable response buffering; the response includes `X-Accel-Buffering: no` and `Cache-Control: no-store, private`. Ensure the deployed canonical HTTPS origin reaches Next consistently, or the same-origin check will reject the form.

Request input is limited to 2 KiB and five seconds. Each process allows two concurrent audits and one per key fingerprint. These are per-process limits, **not** a distributed quota. For multi-instance or publicly promoted deployment, configure a shared edge rate limit and outbound firewall rules. Do not enable proxy/request-body logging for this endpoint or send it to an analytics recorder.

Resource bounds: 500 page attempts; 32 sitemap files; 5,000 discovered URLs; four fetch workers; at least 200 ms between per-origin request starts; per-response 2 MB compressed/decompressed limit; 100 MB shared download budget; 80,000 HTML nodes; depth 128; 40,000 body characters; 500 sentences; 2,000 extracted links per page; 200,000 total links. Failed downloads retain their byte reservation conservatively; `coverage.downloadBudgetUsedBytes` is a budget counter rather than a measured network bill. Very long Crawl-delay values are never shortened; the run may time out instead.

Public IP validation includes all DNS answers, DNS pinning into the socket lookup, private/reserved/metadata address rejection, no URL credentials, default ports only and manual redirect validation. Every HTML/sitemap redirect checks the destination origin's robots policy. robots network/5xx failures fail closed; 401/403 deny; 404/410 mean absent. Cross-host sitemaps are deliberately skipped. XML external entities and document types are rejected. CSV cells are quoted and formula-like values neutralised.

## Known boundaries

Server HTML only; no JavaScript rendering or authenticated pages. The bounded tokenizer handles ordinary HTML, comments, quoted attributes, entities, block boundaries, and common omitted end tags; it is not a full browser HTML5 tree builder and does not evaluate external CSS visibility. Main/article selection and word segmentation may differ on unusual layouts. Counts cover fetched, canonicalised pages, not all site pages. A zero-inbound page in this sample is not proven to be a site-wide orphan.

Classification uses the first 8,000 extracted characters. TF-IDF uses at most 160 weighted terms per page. Jev judgements are advisory, not guarantees. Review source sentences and the intended meaning of an anchor before publishing. This tool does not edit the crawled website.

A crawl that reaches a page/sitemap/byte cap yields an explicitly partial report. Cancellation, deadline, auth failure, provider schema failure or stream interruption is an error, not a successful report. Already processed provider requests may be billed even without a completed report. No resume/persistent job queue is included.

## Verification

Run the dependency-free backend suite:

```sh
node --test tests/internal-links.test.mjs
```

It covers unsafe URL forms, DNS answers and pinning, robots policies, sitemap parsing, HTML extraction, real unlinked placements, candidate exclusions, canonical cycles, crawl caps, full mocked audits, TypeSafe schema/retry handling, CSV injection, fragmented UTF-8 streams, route validation, same-key exclusion, cancel and deadlines. Fixtures use no secrets, public crawling, or paid provider calls.

The PR workflow also installs the existing frozen lockfile, type-checks, lints the new frontend, builds Next, and exercises the actual page in Chromium with an intercepted report stream. The browser flow checks rendering, form submission, all report sections, downloads, no storage, errors and mobile overflow. Do not treat an unexecuted workflow as a passed build.
