# Cloudflare Quick Tunnels article: sources and media

Research date: 2026-09-23. Article languages: English and German.

## Primary sources

- https://try.cloudflare.com/ — free temporary HTTPS sharing, no account or DNS setup, installation and running-local-app prerequisites.
- https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/do-more-with-tunnels/trycloudflare/ — Quick Tunnel command, random hostname, 200 concurrent in-flight requests / HTTP 429, no SSE, no SLA, config.yaml caveat.
- https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/downloads/ — macOS Homebrew command and Windows/Linux installation options.
- https://developers.cloudflare.com/tunnel/ — outbound connector architecture; a tunnel is not application hosting.
- https://developers.cloudflare.com/tunnel/get-started/ — public preview workflow and account/domain requirements for managed public-hostname tunnels.
- https://blog.cloudflare.com/quick-tunnels-anytime-anywhere/ — original announcement (2021-09-02), randomly allocated hostnames, cleanup of disconnected tunnels and public-by-default access. The article does not present Quick Tunnels as newly launched in 2026 or reuse historical availability claims.
- https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/self-hosted-public-app/ — separately configured Access authentication for a self-hosted public application.
- https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/troubleshoot-tunnels/common-errors/ — 502 and local-origin reachability checks.
- https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/configure-tunnels/tunnel-with-firewall/ — outbound port 7844, UDP/QUIC and TCP/HTTP2.
- https://vite.dev/config/server-options#server-allowedhosts — explicit development host allowlists and the danger of allowing all hosts.
- https://nextjs.org/docs/app/api-reference/config/next-config-js/allowedDevOrigins — explicit development origin configuration.

The article links sources inline. Recommendations about reviewing a page, limiting an agent's permission to expose ports, and moving from a preview to an operated service are editorial advice, not product features. The screenshot establishes the shared link preview and chat reaction; it does not measure setup time or establish uptime. No live Quick Tunnel was started during article preparation, and no terminal output or performance results are invented.

## Real media provenance

Committed asset: `public/images/blog/cloudflare-quick-tunnels/whatsapp-preview.webp`.

Source: the author's supplied WhatsApp screenshot (`IMG_0049.jpeg`, 1206 x 2046 pixels). Only the website-preview portion is included. The full original, surrounding conversation, timestamps and large site artwork are not committed. The visible title, description and shortened hostname are from the original pixels, not reconstructed UI. The full disposable hostname is not published as a clickable article link.

Edits: crop box **(263, 887, 1154, 1338)**, using left/top-inclusive and right/bottom-exclusive pixel coordinates; resize with Lanczos to **800 x 405**; encode as WebP (quality 65, method 6). No generated images, invented dashboards or fabricated terminal screenshots are used. English and German captions identify the real screenshot crop. The asset is served locally, without a third-party media embed.

- Size: 14,400 bytes.
- SHA-256: `200c40f7d2b076dd8d1cb3788c39f082094c1f027215c0561d43fb5b67513276`.
- The processed image was visually inspected for legibility and unintended surrounding chat content.

## Validation

Run the dependency-free content and media checks:

```sh
node --test tests/cloudflare-quick-tunnels-article.test.mjs
```

These are regression checks, not a complete MDX parser. The scoped GitHub Actions workflow additionally installs the existing locked dependencies, runs `pnpm build` (including real MDX compilation), starts the production server and checks both language routes and the exact image bytes. It does not start a Cloudflare tunnel, expose a server publicly, change secrets, merge, or deploy.

To repeat the route checks against a running local production server:

```sh
ARTICLE_BASE_URL=http://localhost:3000 node --test tests/cloudflare-quick-tunnels-article.test.mjs
```

A passing static content test must not be described as a passing Next.js production build. Build and route-check results belong in the PR's actual CI status.
