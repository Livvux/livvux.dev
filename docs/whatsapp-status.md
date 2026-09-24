# WhatsApp status after a new blog post

Adding the first `content/<slug>/en.mdx` or `de.mdx` file on `main` starts the
GitHub Actions workflow. It waits until the deployed app contains the post,
then sends exactly one text status containing the post URL through WAHA. A link
preview is requested, but WhatsApp may show only the URL and text without the
Open Graph image in a status. The link is the main content, so no separate
image status is sent. The German post is preferred when both translations
exist. Existing posts, edits, and later translations do not trigger a status.

The workflow signs each request with `BLOG_STATUS_WEBHOOK_SECRET` (GitHub Actions
secret). The same value must be set in the Dokploy app, alongside
`WAHA_INTERNAL_URL=http://waha-internal:3000`, `WAHA_STATUS_SESSION=18pro`,
`WAHA_API_KEY` and `BLOG_STATUS_STATE_DIR=/app/.status-outbox`. The app must share
`dokploy-network` with WAHA. Mount a persistent Docker volume at
`/app/.status-outbox` before enabling the workflow. Neither WAHA's API nor its
dashboard needs a public port.

The marker volume prevents duplicate statuses across workflow reruns and app
deployments. When WAHA accepts the status, the marker becomes `sent`. Markers
from the earlier two-card implementation still prevent repeat sends. If the
request outcome is ambiguous, it becomes `uncertain` and automatic retries
stop; inspect WAHA and the marker before deciding whether to resend. Deleting
or editing a marker without checking the account can post a duplicate.

The bridge returns `401` for unsigned requests. Workflow retries `404`, `425`
(post not deployed yet), and `503` (temporary configuration/session issue) for
up to 20 minutes. It does not retry a failed/ambiguous WAHA send.
