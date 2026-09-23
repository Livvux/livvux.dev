import { handleAudit } from "@/lib/internal-links/server.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(request: Request) {
  return handleAudit(request);
}
