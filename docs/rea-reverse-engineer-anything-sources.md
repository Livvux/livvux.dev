# REA article: editorial source record

Reviewed: 2026-10-11

Articles: `content/rea-reverse-engineer-anything/en.mdx` and `de.mdx`.
Routes: `/blog/rea-reverse-engineer-anything` and `/blog/rea-reverse-engineer-anything/de`.

## Scope

The request supplied a recommendation for REA, a workflow image, ArtCraft links, an Internet Archive collection, and the existing AI game-modding article. The post is a researched guide with original teaching examples. It does not report a hands-on REA installation or an independent reproduction of the featured projects.

The attached image is included unchanged as `public/images/blog/rea-reverse-engineer-anything/workflow.png`, with equivalent English and German alternative text.

## Primary sources

| Subject | Source |
| --- | --- |
| Project and documented capabilities | [REA repository](https://github.com/morluto/rea) |
| License | [REA MIT license](https://github.com/morluto/rea/blob/main/LICENSE) |
| Dated popularity observation | [GitHub daily Trending](https://github.com/trending) |
| Runtime requirements, agent setup and native providers | [REA getting started](https://rea.tools/get-started/) |
| Package selection, setup approvals, instructions and release boundary | [Installation documentation](https://github.com/morluto/rea/blob/main/docs/installation.md) |
| Client compatibility, troubleshooting and model-provider data policies | [REA FAQ](https://rea.tools/faq/) |
| Saved analysis and evidence | [CLI documentation](https://github.com/morluto/rea/blob/main/docs/cli.md) |
| Investigation workflow and unresolved claims | [MCP prompts](https://github.com/morluto/rea/blob/main/docs/mcp-prompts.md) |
| Static JavaScript/Electron inspection | [JavaScript artifact reconstruction](https://github.com/morluto/rea/blob/main/docs/javascript-artifact-reconstruction.md) |
| Browser evidence scope | [Browser observation](https://github.com/morluto/rea/blob/main/docs/browser-observation.md) |
| Static .NET inspection | [Managed-code analysis](https://github.com/morluto/rea/blob/main/docs/managed-code-analysis.md) |
| APK prerequisites and static scope | [Android analysis](https://github.com/morluto/rea/blob/main/docs/android-analysis.md) |
| Clipboard investigation | [Notion showcase](https://rea.tools/showcase/notion/) |
| Text and HTML clipboard representations | [Electron clipboard API](https://www.electronjs.org/docs/latest/api/clipboard) |
| Creative application family | [Crafting Apps directory](https://getartcraft.com/apps) |
| Separate AI studio and licensing | [storytold/artcraft](https://github.com/storytold/artcraft) |
| PSD work, stated development approach and maturity | [PhotoCraft](https://github.com/storytold/photocraft) |
| Other Adobe-related workflows | [FilmCraft](https://github.com/storytold/filmcraft), [LightCraft](https://github.com/storytold/lightcraft), [PdfCraft](https://github.com/storytold/pdfcraft) |
| Public PSD/PSB format reference | [Adobe specification](https://www.adobe.com/devnet-apps/photoshop/fileformatashtml/) |
| Parser/writer identity check | [PhotoCraft PSD corpus test](https://github.com/storytold/photocraft/blob/main/crates/psd/tests/corpus.rs) |
| Import rendering and export/reimport checks | [PhotoCraft I/O corpus test](https://github.com/storytold/photocraft/blob/main/crates/io/tests/corpus.rs) |
| Re-rendering without cached text/smart-object pixels | [PhotoCraft rendering oracles](https://github.com/storytold/photocraft/blob/main/crates/engine/tests/photoshop_oracles.rs) |
| Native game helper and reported verification | [DX-Ball showcase](https://rea.tools/showcase/dx-ball/) |
| DOS bullet geometry investigation | [TH04 showcase](https://rea.tools/showcase/th04/) |
| Static recompilation | [N64Recomp](https://github.com/N64Recomp/N64Recomp) |
| Source reconstruction | [zeldaret/oot](https://github.com/zeldaret/oot) |
| Execution-environment emulation | [QEMU introduction](https://www.qemu.org/docs/master/system/introduction.html) |
| Native-port example, asset requirements and explicit No-AI stance | [Zelda64Recomp](https://github.com/Zelda64Recomp/Zelda64Recomp) |

## Decisions and limits

- The repository page displayed about 96,000 stars at review. REA was first in the daily Trending snapshot. The two views had different star totals, so the article does not combine them into an exact synchronized measurement. The supplied claim of two consecutive days at number one was not independently established.
- Setup guidance uses documented commands. The guide distinguishes package registration, installed instructions and the live agent connection; it does not imply a particular named model is required. Repository-main capabilities can exceed the published npm release.
- Notion's desktop clipboard bridge and the separately cached web-asset probes have different provenance. The article keeps that distinction.
- The three PhotoCraft test files were read, not executed. Their different scopes support the compatibility discussion; no pass rate or professional feature parity is asserted.
- ArtCraft's studio and Crafting Apps are separate projects. Their clean-room descriptions are attributed to the maintainers. No primary evidence established use of REA to build them.
- DX-Ball numbers describe the project's published check of one helper. TH04's example illustrates a specific calculation. Neither is represented as evidence of automatic whole-game reconstruction.
- Zelda64Recomp is a technical recompilation example. Its explicit rejection of generative AI is retained.
- The [supplied Archive collection](https://archive.org/details/@chun_s_ready-to-go_recomp_games) could not be retrieved. The article retains the requested link with this limitation and makes no claims about individual uploads, authorization or REA provenance.
- The instant-search exercise, legacy CSV utility, layer/mask project, bullet-ring JavaScript and starter prompt are original illustrative material. They are not findings about unexamined applications.

## Integration

The article uses the existing MDX renderer, code-copy buttons, bilingual routes, metadata, social cards, sitemap and related-post navigation. No application code, dependencies, new tests or workflows are needed. Existing content-triggered CI covers site compilation and SEO/link behavior.

Validation results belong in the PR description; this source record does not predeclare them.
