# OpenBot / OpenMaus / OpenAI Dots / OpenDots comparison: editorial verification

Checked: 2026-10-06. Languages: English and German.

This article is a source-based comparison, not a controlled hands-on benchmark.
No common task suite, latency benchmark, coding benchmark, reliability measurement,
security audit, or total-cost-of-ownership experiment was performed across all four
products. Product-quality scores in the article are editorial judgments, not measured
benchmark outputs.

## Core distinction

The comparison deliberately separates **open source**, **source available** and
**proprietary managed software**:

| Product | Primary evidence | Editorial interpretation |
| --- | --- | --- |
| OpenBot | https://github.com/nightly-labs/openbot ; https://openbot.run/changelog | Current repository is PolyForm Noncommercial 1.0.0 and explicitly calls itself source-available. Commercial use requires a separate license. Releases through 0.1.11 remain Apache-2.0. Full access remains the default; 0.22 introduced enforced Workspace only for supported provider/OS combinations. |
| OpenMaus | https://github.com/milind-soni/OpenMausBot ; https://github.com/milind-soni/OpenMausBot/blob/main/LICENSING.md ; https://www.openmausbot.com/pricing | Core is Apache-2.0. The `enterprise/` directory is source-available under a separate license. The licensing document states that deleting it leaves the OSS edition. Current public pricing: Free $0, Pro $89/month, Enterprise custom; AI model usage is separate. |
| OpenAI Dots | https://help.openai.com/en/articles/20001530-getting-started-with-your-dot ; https://help.openai.com/en/articles/20001529-dots-privacy-security-and-safety-faqs ; https://help.openai.com/en/articles/20001554-manage-dots-in-chatgpt-workspaces ; https://openai.com/business/pricing/ | Managed proprietary product. Current docs say GPT-6 Astra, own cloud computer, optional local-computer access, recurring work and managed approvals. Personal Pro rollout excludes EEA, Switzerland and UK; Business Premium is available in supported ChatGPT regions. Business Standard is $20 annual-equivalent / $25 monthly and Premium $100 / $125, with a two-paid-seat minimum. |
| OpenDots | https://github.com/CopilotKit/OpenDots ; https://github.com/CopilotKit/OpenDots/blob/main/docs/SETUP.md ; https://github.com/CopilotKit/OpenDots/blob/main/SECURITY.md ; https://www.copilotkit.ai/opendots ; https://www.copilotkit.ai/pricing | MIT application template, currently Alpha and single-owner by design. Durable conversation history uses CopilotKit Intelligence. Intelligence can be cloud-hosted or self-hosted on supported paid deployment paths. Security docs explicitly say OpenDots is not a security-audited autonomous agent. |

## Important wording decisions

- Do not call current OpenBot releases "open source" without qualification.
- Do not call the entire OpenMaus repository Apache-2.0; `enterprise/` is the explicit carve-out.
- Do not imply that OpenDots being MIT makes the complete production stack cost-free or entirely independent of CopilotKit Intelligence.
- Do not imply that OpenAI Dots can be self-hosted or switched to arbitrary third-party model providers.
- Do not claim a winner for answer quality or coding ability. OpenBot/OpenMaus can use overlapping underlying engines and no controlled benchmark was run.
- Keep "local-first" distinct from "offline/private": model-provider traffic can still leave the local machine.
- OpenBot permission text must preserve both facts: Full access is the default, while Workspace only is enforced for supported combinations from 0.22 onward.
- OpenMaus price data uses the current October 2026 pricing page, not the older $29/$49/$99 plan structure.

## Validation target

The regression test checks:

1. bilingual frontmatter and article length;
2. no duplicate Markdown H1;
3. no tracking-query URLs or ChatGPT citation artifacts;
4. required licensing distinctions;
5. current pricing and regional-availability facts;
6. current OpenBot permission caveat;
7. OpenDots Alpha/security caveat;
8. locale-correct internal link to `code-must-be-free`;
9. the same external evidence set in both translations.

The tests are editorial regression checks. They do not independently prove vendor claims.
