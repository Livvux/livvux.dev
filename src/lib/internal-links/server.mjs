import { createHash } from 'node:crypto';
import { AuditError, normalizeUrl, abortable } from './network.mjs';
import { createJev } from './provider.mjs';
import { runAudit } from './analysis.mjs';

const active = new Set();
const headers = { 'Cache-Control': 'no-store, private', 'X-Content-Type-Options': 'nosniff', 'X-Accel-Buffering': 'no', 'Referrer-Policy': 'no-referrer' };
function error(message, status) { return Response.json({ error: message }, { status, headers }); }
async function input(request) {
  if (!request.body) throw new AuditError('A JSON request body is required.');
  const timeout = AbortSignal.any([request.signal, AbortSignal.timeout(5000)]);
  const reader = request.body.getReader(); const chunks = []; let size = 0;
  try {
    while (true) { const { value, done } = await abortable(reader.read(), timeout); if (done) break; size += value.byteLength; if (size > 2048) throw new AuditError('Request body exceeds the size limit.'); chunks.push(value); }
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } finally { await reader.cancel().catch(() => {}); reader.releaseLock(); }
}
/** Dependency injection is for local tests only; the route exposes no configurable network endpoints. */
export async function handleAudit(request, { makeJev = createJev, audit = runAudit, duration = 270_000 } = {}) {
  const expected = new URL(request.url).origin;
  // Dokploy terminates HTTPS before Next, whose internal request URL can be HTTP.
  const allowedOrigins = new Set([expected, 'https://livvux.dev', 'https://www.livvux.dev']);
  if (!allowedOrigins.has(request.headers.get('origin')) || ['cross-site', 'same-site'].includes(request.headers.get('sec-fetch-site'))) return error('Run this tool from the website form.', 403);
  if (!/^application\/json(?:;|$)/i.test(request.headers.get('content-type') ?? '')) return error('Send an application/json request.', 415);
  let body; let site;
  try {
    body = await input(request);
    if (!body || typeof body.url !== 'string' || body.url.length > 500 || typeof body.key !== 'string' || !/^[\x21-\x7e]{8,200}$/.test(body.key.trim())) throw new AuditError('Enter a website URL and a valid TypeSafe API key.');
    site = normalizeUrl(body.url);
  } catch (cause) { return error(cause instanceof AuditError ? cause.message : 'Invalid JSON request.', 400); }
  const fingerprint = createHash('sha256').update(body.key.trim()).digest('hex');
  if (active.size >= 2 || active.has(fingerprint)) { body.key = ''; return error('The tool is busy or this key already has a running audit. Try again after the current run.', 429); }
  active.add(fingerprint);
  const controller = new AbortController();
  const cancel = () => controller.abort(new AuditError('Run cancelled.'));
  request.signal.addEventListener('abort', cancel, { once: true });
  if (request.signal.aborted) cancel();
  const deadline = setTimeout(() => controller.abort(new AuditError('The audit reached its time limit. No complete report was produced. Try a smaller site or run the crawler on a longer-lived server.')), duration);
  let heartbeat; let provider; let disposed = false;
  const dispose = () => { if (disposed) return; disposed = true; clearTimeout(deadline); clearInterval(heartbeat); provider?.clear(); body.key = ''; active.delete(fingerprint); request.signal.removeEventListener('abort', cancel); };
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(output) {
      const emit = (event) => { if (disposed) return; try { output.enqueue(encoder.encode(JSON.stringify(event) + '\n')); } catch { cancel(); } };
      heartbeat = setInterval(() => emit({ event: 'heartbeat' }), 10_000);
      provider = makeJev(body.key.trim(), controller.signal, emit); body.key = '';
      void (async () => {
        try {
          emit({ event: 'stage', stage: 'robots', message: 'Validating your TypeSafe key before crawling.' });
          await provider.validate();
          await audit(site, controller.signal, emit, provider);
        } catch (cause) {
          const reason = controller.signal.aborted ? controller.signal.reason : cause;
          if (!controller.signal.aborted) controller.abort(cause);
          emit({ event: 'error', message: reason instanceof AuditError ? reason.message : 'The audit could not be completed. No complete report was produced.' });
        } finally { dispose(); try { output.close(); } catch { /* Browser disconnected. */ } }
      })();
    },
    cancel() { cancel(); dispose(); },
  });
  return new Response(stream, { headers: { ...headers, 'Content-Type': 'application/x-ndjson; charset=utf-8' } });
}
