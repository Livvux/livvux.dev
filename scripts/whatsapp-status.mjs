import { createHmac } from "node:crypto";
import { execFileSync } from "node:child_process";

export function newPostSlugs(base, head, git = (args) => execFileSync("git", args, { encoding: "utf8" })) {
  const files = git(["diff", "--name-only", "--diff-filter=A", base, head, "--", "content/"]);
  const candidates = new Set();
  for (const file of files.split("\n")) {
    const match = /^content\/([a-z0-9][a-z0-9-]{0,99})\/(?:de|en)\.mdx$/.exec(file);
    if (match) candidates.add(match[1]);
  }
  return [...candidates].filter((slug) => {
    try {
      git(["cat-file", "-e", `${base}:content/${slug}/de.mdx`]);
      return false;
    } catch { /* This translation did not exist before the push. */ }
    try {
      git(["cat-file", "-e", `${base}:content/${slug}/en.mdx`]);
      return false;
    } catch { /* Neither translation existed before the push. */ }
    return true;
  });
}

export async function notifyPost(slug, commit, secret, endpoint, { fetcher = fetch, sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)), attempts = 40 } = {}) {
  const body = JSON.stringify({ slug, commit });
  for (let attempt = 1; attempt <= attempts; attempt++) {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signature = createHmac("sha256", secret).update(timestamp + "." + body).digest("hex");
    let response;
    try {
      response = await fetcher(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Blog-Status-Timestamp": timestamp,
          "X-Blog-Status-Signature": "sha256=" + signature,
        },
        body,
        signal: AbortSignal.timeout(15_000),
      });
    } catch {
      if (attempt === attempts) throw new Error(`${slug}: endpoint unavailable after ${attempts} attempts`);
      await sleep(30_000);
      continue;
    }
    if (response.ok) {
      const result = await response.json();
      console.log(`${slug}: ${result.result}`);
      return;
    }
    if ([404, 425, 503].includes(response.status) && attempt < attempts) {
      await sleep(30_000);
      continue;
    }
    throw new Error(`${slug}: status bridge returned HTTP ${response.status}`);
  }
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  const [base, head] = process.argv.slice(2);
  const secret = process.env.BLOG_STATUS_WEBHOOK_SECRET;
  if (!base || !head || !secret) throw new Error("Missing commit range or webhook secret");
  const slugs = newPostSlugs(base, head);
  console.log(`New posts: ${slugs.length}`);
  for (const slug of slugs) {
    await notifyPost(slug, head, secret, "https://livvux.dev/api/internal/blog-status");
  }
}
