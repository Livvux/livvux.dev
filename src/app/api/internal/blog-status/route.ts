import { createHmac, timingSafeEqual } from "node:crypto";
import { mkdir, open, readFile, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { allPosts } from "content-collections";
import { z } from "zod";
import { postId } from "@/lib/posts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const requestSchema = z.object({
  slug: z.string().regex(/^[a-z0-9][a-z0-9-]{0,99}$/),
  commit: z.string().regex(/^[a-f0-9]{40}$/),
}).strict();

const MAX_BODY_BYTES = 1024;
const MAX_CLOCK_SKEW_SECONDS = 300;

function reply(status: number, result: string) {
  return Response.json({ result }, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

async function readSmallBody(request: Request): Promise<string | null> {
  const reader = request.body?.getReader();
  if (!reader) return null;
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_BODY_BYTES) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks).toString("utf8");
}

function hasValidSignature(
  raw: string,
  timestamp: string | null,
  signature: string | null,
  secret: string,
): boolean {
  if (!timestamp || !/^\d{10}$/.test(timestamp)) return false;
  if (!signature || !/^sha256=[a-f0-9]{64}$/.test(signature)) return false;
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > MAX_CLOCK_SKEW_SECONDS) {
    return false;
  }
  const expected = createHmac("sha256", secret)
    .update(timestamp + "." + raw)
    .digest();
  const received = Buffer.from(signature.slice(7), "hex");
  return timingSafeEqual(expected, received);
}

type Marker = {
  state: "sending" | "image_sent" | "sent" | "uncertain";
  commit: string;
  startedAt: string;
  messageId?: string;
};

async function readMarker(path: string): Promise<Marker | null> {
  try {
    return JSON.parse(await readFile(path, "utf8")) as Marker;
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return null;
    }
    throw error;
  }
}

async function writeMarker(path: string, marker: Marker) {
  const temporary = path + "." + process.pid + ".tmp";
  await writeFile(temporary, JSON.stringify(marker), { flag: "wx" });
  await rename(temporary, path);
}

export async function POST(request: Request) {
  const signingSecret = process.env.BLOG_STATUS_WEBHOOK_SECRET;
  const apiKey = process.env.WAHA_API_KEY;
  const baseUrl = process.env.WAHA_INTERNAL_URL;
  const session = process.env.WAHA_STATUS_SESSION;
  const stateDir = process.env.BLOG_STATUS_STATE_DIR;
  if (!signingSecret || !apiKey || !baseUrl || !session || !stateDir) {
    return reply(503, "not_configured");
  }

  const raw = await readSmallBody(request);
  if (raw === null) return reply(413, "request_too_large");
  if (!hasValidSignature(
    raw,
    request.headers.get("x-blog-status-timestamp"),
    request.headers.get("x-blog-status-signature"),
    signingSecret,
  )) {
    return reply(401, "unauthorized");
  }

  let input: z.infer<typeof requestSchema>;
  try {
    input = requestSchema.parse(JSON.parse(raw));
  } catch {
    return reply(400, "invalid_request");
  }

  const translations = allPosts.filter((post) => postId(post) === input.slug);
  const post = translations.find((entry) => entry._meta.path.endsWith("/de"))
    ?? translations.find((entry) => entry._meta.path.endsWith("/en"));
  if (!post) return reply(425, "post_not_deployed");
  const publishedAt = Date.parse(post.publishedAt);
  if (!Number.isFinite(publishedAt) || publishedAt > Date.now()) {
    return reply(422, "post_not_published");
  }

  const origin = new URL(baseUrl);
  if (origin.protocol !== "http:") return reply(503, "invalid_waha_url");
  const api = new URL("/api/" + encodeURIComponent(session), origin);
  const headers = { "X-Api-Key": apiKey };
  try {
    const sessionResponse = await fetch(
      new URL("/api/sessions/" + encodeURIComponent(session), origin),
      { headers, cache: "no-store", signal: AbortSignal.timeout(10_000) },
    );
    if (!sessionResponse.ok) return reply(503, "waha_session_unavailable");
    const sessionState: unknown = await sessionResponse.json();
    if (!sessionState || typeof sessionState !== "object"
      || !("status" in sessionState) || sessionState.status !== "WORKING") {
      return reply(503, "waha_session_not_working");
    }
  } catch {
    return reply(503, "waha_session_unavailable");
  }

  await mkdir(stateDir, { recursive: true });
  const markerPath = join(stateDir, input.slug + ".json");
  const existing = await readMarker(markerPath);
  if (existing?.state === "sent") return reply(200, "already_sent");
  if (existing) return reply(409, "delivery_uncertain");

  const marker: Marker = {
    state: "sending",
    commit: input.commit,
    startedAt: new Date().toISOString(),
  };
  try {
    const handle = await open(markerPath, "wx", 0o600);
    try {
      await handle.writeFile(JSON.stringify(marker));
      await handle.sync();
    } finally {
      await handle.close();
    }
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "EEXIST") {
      return reply(409, "delivery_in_progress");
    }
    throw error;
  }

  const path = "/blog/" + input.slug + (post._meta.path.endsWith("/de") ? "/de" : "");
  const text = "https://livvux.dev" + path;
  try {
    const response = await fetch(
      new URL(api.pathname + "/status/text", origin),
      {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ text, linkPreview: true, linkPreviewHighQuality: true }),
        cache: "no-store",
        signal: AbortSignal.timeout(30_000),
      },
    );
    if (!response.ok) {
      await writeMarker(markerPath, { ...marker, state: "uncertain" });
      return reply(502, "delivery_uncertain");
    }
    const result: unknown = await response.json().catch(() => null);
    let messageId: string | undefined;
    if (result && typeof result === "object") {
      if ("id" in result && typeof result.id === "string") {
        messageId = result.id;
      } else if ("key" in result && result.key && typeof result.key === "object"
        && "id" in result.key && typeof result.key.id === "string") {
        messageId = result.key.id;
      }
    }
    await writeMarker(markerPath, { ...marker, state: "sent", messageId });
    return reply(200, "sent");
  } catch {
    await writeMarker(markerPath, { ...marker, state: "uncertain" });
    return reply(502, "delivery_uncertain");
  }
}
