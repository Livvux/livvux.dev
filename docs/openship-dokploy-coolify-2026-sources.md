# OpenShip vs Dokploy vs Coolify (2026) — editorial verification

Checked: 2026-11-03. Articles: \`content/openship-vs-dokploy-vs-coolify/{en,de}.mdx\`.

## Editorial scope

- Neutral bilingual documentation comparison, not a hands-on deployment, performance, security, restore, or availability benchmark.
- No synthesized speed scores, Github star counts, universal winner, release-version pin, or unsourced stability ranking.
- No exact cloud prices in prose: the three vendors package management and compute differently; refer readers to current pricing and edition pages.
- Differences between standalone remote servers, multi-server deployments and node clusters are explained explicitly.
- No change to the app, dependency graph, blog routing, sitemap or SEO system. Existing locale-aware MDX routing discovers both articles automatically.

## Verified distinctions and primary sources

| Topic | Source | Editorial treatment |
| --- | --- | --- |
| OpenShip architecture and license | https://github.com/oblien/openship | Desktop/web/CLI/SDK; Apache-2.0 for OpenShip-authored code with separate third-party licenses; no claim of universal Kubernetes support. |
| OpenShip K3s | https://openship.io/features/autoscaling-load-balancing | Cluster/replica feature targets supported application workloads; self-hosted/desktop controller; policy autoscaling and gateway failover not implemented. |
| OpenShip cluster details | https://openship.io/docs/guides/mcp-clusters-and-scaling | K3s application replication vs Compose scaling on connected Swarm; stateful topology limitations. |
| OpenShip Actions | https://openship.io/docs/guides/actions | Github-compatible workflows with two execution modes and compatibility limits; not full Github Actions parity. |
| OpenShip stateful changes | https://openship.io/docs/guides/database-migrations | Pre-deploy backup is not a substitute for an actual migration and tested restore. |
| OpenShip MCP | https://openship.io/docs/mcp | Integrated OAuth/PAT with permission enforcement on each tool call. |
| Dokploy remote and clusters | https://docs.dokploy.com/docs/core/deployment-options | Remote SSH-managed servers are independent. Swarm nodes can replicate workloads but require registries/storage planning. |
| Dokploy editions | https://docs.dokploy.com/docs/core/differences | Distinguish OSS from enterprise SSO, SCIM, custom roles and audit logs. |
| Dokploy previews | https://docs.dokploy.com/docs/core/applications/preview-deployments | Caution about running untrusted public PR builds. |
| Dokploy backups | https://docs.dokploy.com/docs/core/backups | Management/control-plane backup distinct from app data. |
| Dokploy volume backups | https://docs.dokploy.com/docs/core/volume-backups | Named volumes, not bind mounts; ongoing writes can compromise consistency. |
| Dokploy MCP | https://github.com/Dokploy/mcp | Official separately hosted package, access depends on Dokploy API credentials; tool presets and redaction options. |
| Coolify architecture | https://coolify.io/docs/core/how-coolify-works | SSH to workload servers; controller not in app request path. |
| Coolify multi-server | https://coolify.io/docs/core/infrastructure/scaling/overview | Multi-server app deployments plus external load balancing, not an automatically shared cluster. |
| Coolify Docker Swarm | https://coolify.io/docs/core/infrastructure/scaling/docker-swarm | Deprecated, planned removal in v5; avoid recommending new Swarm deployments. |
| Coolify proxy | https://coolify.io/docs/core/networking/proxy/overview | Traefik default, Caddy supported. |
| Coolify databases | https://coolify.io/docs/databases/backups | Scheduled backup workflow excludes Redis/Dragonfly/KeyDB; S3-compatible backup targets. |
| Coolify MCP | https://coolify.io/docs/mcp/how-mcp-works | Integrated, team-bound, token-permission-scoped; explicit self-hosted activation. |
| Pricing | https://openship.io/pricing ; https://dokploy.com/pricing ; https://docs.dokploy.com/docs/core/differences ; https://coolify.io/pricing | Free self-hosted paths, optional paid offerings. Avoid unqualified apples-to-apples cloud price claims. |

## Important boundaries

1. One-click database deployment does not imply automated HA or point-in-time recovery.
2. A successful database dump is not a validated recovery procedure; test restoring off-server backups.
3. Reverting an image does not undo schema migrations.
4. MCP permission systems do not remove the risk of exposing powerful infrastructure operations to agents.
5. OpenShip's documentation and README may describe features at different rollout stages. The article uses scoped wording and links to the specific cluster documentation rather than promoting all features as universally available.
6. The comparison reflects public documentation checked on the listed date and does not assert independent hands-on testing.

## Validation

The repository's existing \`.github/workflows/sitemap.yml\` is triggered by changes beneath \`content/**\`. It runs the real MDX production build, type checking, and sitemap/SEO integration checks.

Before merging, review the PR checks and rendered English/German routes:
- \`/blog/openship-vs-dokploy-vs-coolify\`
- \`/blog/openship-vs-dokploy-vs-coolify/de\`

Any failed or unexecuted check should be reported as such; this file does not claim a completed build.
