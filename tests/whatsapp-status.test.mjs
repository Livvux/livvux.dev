import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";
import { newPostSlugs, notifyPost } from "../scripts/whatsapp-status.mjs";

test("only newly introduced post directories are notified once", () => {
  const calls = [];
  const git = (args) => {
    calls.push(args);
    if (args[0] === "diff") return [
      "content/new-post/en.mdx",
      "content/new-post/de.mdx",
      "content/old-post/de.mdx",
      "content/old-post/image.png",
    ].join("\n");
    if (args[2] === "base:content/old-post/en.mdx") return "";
    throw new Error("path missing");
  };
  assert.deepEqual(newPostSlugs("base", "head", git), ["new-post"]);
  assert.ok(calls.some((args) => args[0] === "cat-file"));
});

test("notification is signed and retries until the deployed post exists", async () => {
  const statuses = [425, 200];
  let waits = 0;
  const fetcher = async (_url, options) => {
    const timestamp = options.headers["X-Blog-Status-Timestamp"];
    const expected = createHmac("sha256", "secret")
      .update(timestamp + "." + options.body).digest("hex");
    assert.equal(options.headers["X-Blog-Status-Signature"], "sha256=" + expected);
    assert.deepEqual(JSON.parse(options.body), { slug: "new-post", commit: "a".repeat(40) });
    const status = statuses.shift();
    return { ok: status === 200, status, json: async () => ({ result: "sent" }) };
  };
  await notifyPost("new-post", "a".repeat(40), "secret", "https://example.test", {
    fetcher,
    sleep: async () => { waits++; },
    attempts: 2,
  });
  assert.equal(waits, 1);
});

test("ambiguous delivery stops retries", async () => {
  let requests = 0;
  await assert.rejects(() => notifyPost("new-post", "a".repeat(40), "secret", "https://example.test", {
    fetcher: async () => { requests++; return { ok: false, status: 409 }; },
    attempts: 2,
  }), /HTTP 409/);
  assert.equal(requests, 1);
});
