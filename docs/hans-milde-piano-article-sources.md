# Hans Milde piano tuning check: article sources and media

Publication: 24 September 2026. Slug: `hans-milde-piano-tuning-check`.
English: `/blog/hans-milde-piano-tuning-check`.
German: `/blog/hans-milde-piano-tuning-check/de`.

## Editorial basis

Both MDX files adapt the user's already prepared English and German article.
The user described Hans Milde as a client and friend and said AI assisted the
software's development. The copy distinguishes AI-assisted development from the
local, deterministic audio-analysis implementation. Neither source code nor
algorithms are claimed to be unique; the distinctive element is the guided,
piano-specific workflow connected to a craft professional.

Public tool: https://klavierbau-milde.de/klavier-stimmung-test
Implementation review: https://github.com/Livvux/hansmilde-piano-2/pull/19
Reviewed source snapshot: `2acf421b49c87a0b9a0e1bf5f9ba5278d6260260`.
All implementation file links are pinned to that commit, not a moving main branch.
The client repository may require authorization; both articles say so. No client
source files, recordings, credentials or private conversations are copied here.

## Technical evidence

The source snapshot documents AudioWorklet capture, an analysis worker, YIN/NSDF
agreement, a separate fundamental-frequency spectral check, and conservative
measurement/assessment rules. The articles link to the corresponding source files
and `docs/TUNING-TEST.md`. Public technical references include MDN's AudioWorklet
documentation and de Cheveigne and Kawahara's 2002 YIN paper (DOI 10.1121/1.1458024).
PianoMeter's own support documentation supplies context on stretch/inharmonicity;
muted.io is cited as an existing browser tuner, not an independent benchmark.

The source regression corpus has 6 × 9 × 3 × 3 = 486 synthetic accuracy fixtures.
The less-than-one-cent condition is a test assertion, not a promised accuracy for
real microphones or instruments. The client's documented need for real-instrument
validation is retained. No physical piano or microphone was tested for this blog PR.
A merged implementation PR is not represented as professional field validation.

## Illustrations

The two local SVG figures are vector versions of the calculated example in the
prepared article. They are not screenshots and not real piano recordings. There
are no external image requests, scripts, embedded fonts or runtime chart packages.
Solid circles versus dashed hollow squares distinguish traces without relying on
color. Each image has a localized title/description and article alt text, explicit
dimensions, a caption, and a matching readable HTML table generated from MDX.

Reproduce the data with `1200 * Math.log2(432 / 440)` = approximately -31.7666536334
cents. The uniform trace repeats this value six times, for C4, D4, E4, G4, A4, C5.
The uneven trace adds `[0, 0, -18, 0, 18, 0]`; both medians are identical. The examples
omit instrument-specific stretch. A4 = 442 Hz versus 440 Hz is approximately +7.85
cents. SVG coordinates use `x = 104 + index * 144` and
`y = 178 + (10 - cents) * 4.5`. The Node tests independently check these values.

## Verification

`node --test tests/hans-milde-piano-article.test.mjs` checks metadata, footnotes,
pinned sources, explicit limitations, localized graphics and numerical parity.
The scoped GitHub Actions workflow installs the existing frozen lockfile, builds
the site, starts the production server, and runs the same suite with
`ARTICLE_BASE_URL=http://localhost:3000` to check both routes and SVG responses.
It does not alter dependencies, existing CI checks, application code or deployment.
