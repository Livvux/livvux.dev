# Deployment, abuse limits and privacy checks (2026-10-18)

## Docker / Dokploy

- The Dockerfile uses the Next.js standalone server with a non-root UID 1001.
- If the WhatsApp blog-status integration is enabled, `BLOG_STATUS_STATE_DIR` **must** be a writable, persistent volume accessible to UID 1001. An ephemeral directory may cause duplicate statuses after a restart.
- Keep WAHA and API credentials on the internal network. Do not expose WAHA publicly.
- After deployment, check `/`, `/robots.txt`, `/sitemap.xml`, `/privacy`, and `/imprint`; verify container health checks and rollback behavior.

## Internal-links crawler

The crawler checks public IPs, pins DNS for each connection, limits redirects, respects robots.txt and accepts at most two concurrent audits **per process**. Its process-local quotas are not a distributed admission controller.

Enforce at the ingress:
1. A Cloudflare/WAF rate limit on `POST /api/tools/internal-links` (starting point: 5 requests per IP per 10 minutes, tune to actual traffic).
2. Request body limits and an origin firewall, so the app is reachable only through the trusted reverse proxy.
3. A distributed quota (for example Redis) if more than one app replica is deployed. Do not trust unverified `X-Forwarded-For` headers.
4. Logs/metrics for rejects, aborts and provider failures without recording API keys or crawled private data.

## Legal and privacy verification

Public operator details are based on https://lkmedia.net/imprint/ (checked 2026-10-18).

Before merging, check live hosting and proxy providers, their locations/agreements and **actual** access-log retention. Check Umami collector retention, TypeSafe data processing and transfer safeguards, article image hosts, X embed behavior, and the production email workflow. Do not copy lkmedia.net's Plausible, Turnstile or Stripe disclosures: they are not used on this portfolio.

The privacy pages describe repository behavior and flag deployment-specific retention as requiring confirmation; they are not a substitute for professional legal review.
