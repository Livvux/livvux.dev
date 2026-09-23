import { AuditError, createGate } from './network.mjs';
import { setTimeout as sleep } from 'node:timers/promises';
export const MODEL = 'jev-1.13.0';
export const INPUT_PRICE_PER_MILLION = 0.042; // TypeSafe model documentation checked 2026-09-23; estimate, not invoice.

export function createJev(key, signal, emit, { fetcher = fetch, skipDelay = false } = {}) {
  const usage = { requests: 0, inputTokens: 0, outputTokens: 0, cost: 0, model: MODEL, estimated: true };
  const gate = createGate();
  async function call(path, body) {
    for (let attempt = 0; attempt < 3; attempt++) {
      signal.throwIfAborted(); await gate(skipDelay ? 0 : 80, signal);
      let response;
      try {
        response = await fetcher(`https://api.typesafe.ai/v1/${path}`, {
          method: body ? 'POST' : 'GET', headers: { Authorization: `Bearer ${key}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
          ...(body ? { body: JSON.stringify(body) } : {}), redirect: 'error', cache: 'no-store', signal: AbortSignal.any([signal, AbortSignal.timeout(20_000)]),
        });
      } catch { signal.throwIfAborted(); throw new AuditError('TypeSafe could not be reached or timed out. No report was completed.'); }
      if (body) { usage.requests++; emit({ event: 'usage', usage: { ...usage } }); }
      if ([429, 529].includes(response.status) && attempt < 2) {
        const header = response.headers.get('retry-after');
        const delay = header == null ? 1000 * 2 ** attempt : /^\d+(?:\.\d+)?$/.test(header) ? Number(header) * 1000 : Math.max(0, Date.parse(header) - Date.now());
        await response.body?.cancel();
        if (!Number.isFinite(delay) || delay > 20_000) throw new AuditError('TypeSafe is rate limited. Try again later.');
        await sleep(skipDelay ? 0 : Math.max(delay, 500), undefined, { signal }); continue;
      }
      if (!response.ok) { await response.body?.cancel(); throw new AuditError([401, 403].includes(response.status) ? 'TypeSafe rejected this API key. Check its permissions and available credits.' : `TypeSafe returned HTTP ${response.status}. Please try again later.`); }
      if (!response.body) throw new AuditError('TypeSafe returned an empty response.');
      const reader = response.body.getReader(); const chunks = []; let bytes = 0;
      try { while (true) { const part = await reader.read(); if (part.done) break; bytes += part.value.byteLength; if (bytes > 2_000_000) throw new AuditError('TypeSafe response exceeds the size limit.'); chunks.push(part.value); } }
      finally { await reader.cancel().catch(() => {}); reader.releaseLock(); }
      let result;
      try { result = JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { throw new AuditError('TypeSafe returned invalid JSON.'); }
      if (body) {
        if (result.model !== MODEL) throw new AuditError('TypeSafe returned a different model than requested.');
        const input = result.usage?.input_tokens; const output = result.usage?.output_tokens;
        if (!Number.isSafeInteger(input) || input < 0 || !Number.isSafeInteger(output) || output < 0) throw new AuditError('TypeSafe returned invalid usage data.');
        usage.inputTokens += input; usage.outputTokens += output; usage.cost = usage.inputTokens * INPUT_PRICE_PER_MILLION / 1_000_000;
        emit({ event: 'usage', usage: { ...usage } });
      }
      return result;
    }
    throw new AuditError('TypeSafe is temporarily unavailable.');
  }
  return {
    usage,
    async validate() { const result = await call('models'); if (!Array.isArray(result.models) || !result.models.some((model) => [MODEL, 'jev-latest'].includes(model.name))) throw new AuditError(`Your TypeSafe account does not list a supported Jev model.`); },
    async ask(state, questions) { const result = await call('systemone', { model: MODEL, state, questions }); if (!result.answers || typeof result.answers !== 'object') throw new AuditError('TypeSafe returned no decisions.'); return result.answers; },
    clear() { key = ''; },
  };
}
export function probability(value) { if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 1) throw new AuditError('TypeSafe returned an invalid probability.'); return value; }
export function choice(answer, allowed) {
  if (answer?.type !== 'choice' || !Object.hasOwn(allowed, answer.choice)) throw new AuditError('TypeSafe chose an option that was not supplied.');
  return { value: answer.choice, confidence: probability(answer.confidence) };
}
