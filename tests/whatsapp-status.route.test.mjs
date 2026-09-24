import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { createServer } from "node:http";
import { createServer as createTcpServer } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

async function freePort() {
  const server = createTcpServer();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = server.address().port;
  await new Promise((resolve) => server.close(resolve));
  return port;
}

test("blog bridge sends the OG image as a JPEG status with German caption once", { timeout: 60_000 }, async () => {
  const calls = [];
  const mock = createServer(async (request, response) => {
    response.setHeader("Content-Type", "application/json");
    if (request.method === "GET" && request.url === "/api/sessions/18pro") {
      response.end(JSON.stringify({ status: "WORKING" }));
      return;
    }
    if (request.method === "POST") {
      const chunks = [];
      for await (const chunk of request) chunks.push(chunk);
      calls.push({ path: request.url, body: JSON.parse(Buffer.concat(chunks).toString()) });
      response.end(JSON.stringify({ key: { id: "mock-status" } }));
      return;
    }
    response.statusCode = 404;
    response.end("{}");
  });
  await new Promise((resolve) => mock.listen(0, "127.0.0.1", resolve));
  const stateDir = await mkdtemp(join(tmpdir(), "blog-status-test-"));
  const port = await freePort();
  const app = spawn("pnpm", ["start", "-p", String(port)], {
    env: {
      ...process.env,
      PORT: String(port),
      BLOG_STATUS_WEBHOOK_SECRET: "test-signing-secret",
      WAHA_API_KEY: "test-waha-key",
      WAHA_INTERNAL_URL: `http://127.0.0.1:${mock.address().port}`,
      WAHA_STATUS_SESSION: "18pro",
      BLOG_STATUS_STATE_DIR: stateDir,
    },
    stdio: "ignore",
  });
  try {
    const endpoint = `http://127.0.0.1:${port}/api/internal/blog-status`;
    let ready = false;
    for (let attempt = 0; attempt < 80; attempt++) {
      try {
        const response = await fetch(endpoint, { method: "POST", body: "{}" });
        if (response.status === 401) { ready = true; break; }
      } catch { /* Next is starting. */ }
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
    assert.equal(ready, true, "Next server did not start");

    const body = JSON.stringify({ slug: "macos-finder-webp-converter-2026", commit: "a".repeat(40) });
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signature = createHmac("sha256", "test-signing-secret")
      .update(timestamp + "." + body).digest("hex");
    const send = () => fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Blog-Status-Timestamp": timestamp,
        "X-Blog-Status-Signature": "sha256=" + signature,
      },
      body,
    });
    const first = await send();
    assert.equal(first.status, 200);
    assert.equal((await first.json()).result, "sent");
    const second = await send();
    assert.equal(second.status, 200);
    assert.equal((await second.json()).result, "already_sent");
    assert.equal(calls.length, 1);
    assert.equal(calls[0].path, "/api/18pro/status/image");
    assert.equal(calls[0].body.file.mimetype, "image/jpeg");
    assert.equal(Buffer.from(calls[0].body.file.data, "base64").subarray(0, 3).toString("hex"), "ffd8ff");
    assert.match(calls[0].body.caption, /https:\/\/livvux\.dev\/blog\/macos-finder-webp-converter-2026\/de$/);
  } finally {
    if (app.exitCode === null) {
      app.kill("SIGTERM");
      await new Promise((resolve) => app.once("exit", resolve));
    }
    await new Promise((resolve) => mock.close(resolve));
    await rm(stateDir, { recursive: true, force: true });
  }
});
