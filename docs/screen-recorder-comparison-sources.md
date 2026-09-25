# Screen recorder comparison: editorial verification

Checked: 2026-09-25. Languages: English and German. Author voice reference:
`content/code-must-be-free/{en,de}.mdx` (direct first-person opinions, short
paragraphs, clear distinction between open code and paid convenience).

## Scope and limits

This is a documentation and release comparison, not a hands-on benchmark. No
recording, export-speed, CPU/RAM, reliability, audio-sync or speech-recognition
measurement was performed. Suggested evaluation steps are explicitly prospective.
No synthetic scores, product screenshots, invented testimonials or affiliate links.
Current README descriptions may be newer than a release; the opening states this.

## Primary evidence and corrections

| Product | Primary evidence | Editorial decisions |
| --- | --- | --- |
| Recordly | https://recordly.dev/ ; https://github.com/webadderallorg/Recordly ; https://github.com/webadderallorg/Recordly/releases/tag/v1.4.0 | The original webadderallorg project, not similarly named commercial sites. Free app. Current README says AGPL-3.0, not MIT. macOS 14+, Windows build 19041+ native path, Linux cursor double-render/PipeWire caveats. Captions are confirmed by the Windows fix; their processing location was not verified. MP4/GIF confirmed; no invented universal 4K/60 ceiling. `.recordly` references source media, so the project file alone is not a complete backup. |
| Screendrop | https://github.com/fayazara/Screendrop ; https://github.com/fayazara/Screendrop/releases ; https://github.com/fayazara/Screendrop/releases/tag/v0.30.0 ; https://github.com/fayazara/Screendrop/releases/tag/v0.32.0 | Native macOS 26.4+ per current requirements. Latest listed 0.33.0 (Sep 22). Recording Studio, separate tracks, on-device narration/captions and transcript editing are real documented features, not a basic-recorder stereotype. MP4 added in 0.30.1; 30/60 fps choices in 0.32.0. No confirmed equivalent GIF export. Current CC0-1.0 after 0.32.0 reversal of an earlier licensing change. No cross-product speed ranking inferred from the maintainer's Metal speedup. |
| Screendrop sharing | https://github.com/fayazara/screendrop-worker | Cloudflare Workers/R2/D1 in the user's account. Anyone with a recording link can view it; transcripts described as indexable. Upload authentication and comment sign-in are not viewer authentication. No blanket private/compliance claim. |
| Screen Studio | https://screen.studio/ ; https://screen.studio/changelog ; https://screen.studio/guide ; https://screen.studio/guide/system-requirements ; https://screen.studio/guide/captions ; https://screen.studio/guide/explanation-of-export-settings ; https://screen.studio/guide/shareable-links ; https://screen.studio/guide/activating-screen-studio ; https://screen.studio/guide/sharing-your-project | Mac-only; 13.1+; supported Intel as well as Apple Silicon. Latest changelog 3.7.5-4595 (Aug 5). Local Whisper/Apple Speech captions use mic voiceover, not general system audio. Hosted sharing exists; its 30-minute cap is not a local recording cap. New-customer subscriptions versus legacy licenses. Homepage animated price digits represent $29/month or $9/month billed annually ($108/year). No previous one-time price reused as a current offer. |
| Cap modes and availability | https://cap.so/features/studio-mode ; https://cap.so/features/instant-mode ; https://cap.so/download ; https://cap.so/changelog ; https://github.com/CapSoftware/Cap | Studio is local-first, Instant uploads during capture. Linux packages are now available; Windows download remains labeled beta. Latest desktop 0.6.0 (Aug 31) with optional GPUI preview kept distinct. No claim of equal feature maturity across platforms. Website transcripts and desktop editing are distinguished. |
| Cap prices and rights | https://cap.so/pricing ; https://cap.so/docs/commercial-license ; https://github.com/CapSoftware/Cap#license | Desktop $29/year or $58 once; Pro $12/user/month or $8.16 billed annually. Pro includes desktop rights; no double billing in comparison. Free official binaries are personal-use; self-built source is explicitly distinguished by vendor policy. Current source has AGPLv3, MIT crate families and third-party licenses. Pricing prose/FAQ says unlimited local personal recording while a table row contradicts it; article discloses this instead of hiding it. Desktop card specifies 20 cloud links/month, up to five minutes each; do not extend that exact count to the free tier without verification. |
| Cap hosting and automation | https://cap.so/docs/self-hosting ; https://cap.so/docs | Own storage is not full self-hosting. Optional external transcription/AI can remain external when the app is self-hosted. CLI/API are documented. No production setup was performed. The S3 documentation navigation target redirected to the overview during research, so no unverified claim that custom buckets disable AI is included. |

Annualized prices are arithmetic: 29×12=348, 9×12=108, 12×12=144,
8.16×12=97.92. USD display prices, no currency conversion; checkout decides taxes.

## Validation

`node --test tests/screen-recorder-comparison.test.mjs` checks metadata, bilingual
coverage, four consistent Markdown tables, primary-source URL structure, equal
external evidence sets, arithmetic and explicit limitations. These are structural
and editorial regression checks, not independent proof of the vendor claims.

The path-scoped GitHub workflow additionally installs the existing locked
dependencies, runs the actual Next.js build (including MDX compilation), type
checks, then requests the real English/German routes and verifies titles,
canonical/hreflang, language switch, rendered tables, blog discovery and safe
external links. Integration checks are opt-in via `ARTICLE_BASE_URL` on localhost.
Report CI results from the actual run; do not infer a passing build from the
zero-dependency checks. No application code or dependencies are changed.
