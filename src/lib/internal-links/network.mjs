import { lookup } from 'node:dns/promises';
import { isIP, BlockList } from 'node:net';
import http from 'node:http';
import https from 'node:https';
import { createGunzip, createInflate, createBrotliDecompress } from 'node:zlib';
import { setTimeout as sleep } from 'node:timers/promises';

export class AuditError extends Error {}
export const BOT = 'LivvuxBot/1.0 (+https://livvux.dev/tools/crawler)';
const blocked = new BlockList();
for (const [address, prefix] of [
  ['0.0.0.0', 8], ['10.0.0.0', 8], ['100.64.0.0', 10], ['127.0.0.0', 8],
  ['169.254.0.0', 16], ['172.16.0.0', 12], ['192.0.0.0', 24], ['192.0.2.0', 24],
  ['192.88.99.0', 24], ['192.168.0.0', 16], ['198.18.0.0', 15], ['198.51.100.0', 24],
  ['203.0.113.0', 24], ['224.0.0.0', 4], ['240.0.0.0', 4],
]) blocked.addSubnet(address, prefix, 'ipv4');
blocked.addAddress('168.63.129.16', 'ipv4'); // Azure platform virtual address.
for (const [address, prefix] of [['2001::', 23], ['2001:db8::', 32], ['2002::', 16], ['3fff::', 20]]) blocked.addSubnet(address, prefix, 'ipv6');
const globalV6 = new BlockList();
globalV6.addSubnet('2000::', 3, 'ipv6');
export function isPublicAddress(address) {
  const family = isIP(address);
  if (family === 4) return !blocked.check(address, 'ipv4');
  return family === 6 && globalV6.check(address, 'ipv6') && !blocked.check(address, 'ipv6');
}
export function normalizeUrl(value, base) {
  let url;
  try {
    const input = String(value).trim();
    url = new URL(base ? input : /^[a-z][a-z\d+.-]*:/i.test(input) ? input : `https://${input}`, base);
  } catch { throw new AuditError('Enter a valid public website URL.'); }
  const host = url.hostname.replace(/^\[|\]$/g, '').toLowerCase();
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.port || url.href.length > 2048) throw new AuditError('Only public HTTP(S) URLs on the default ports are supported; credentials are not allowed.');
  if ((!isIP(host) && (!host.includes('.') || /\.(localhost|local|internal|lan|home|test|invalid|onion)\.?$/i.test(host))) || (isIP(host) && !isPublicAddress(host))) throw new AuditError('Private, local, and reserved network addresses are not allowed.');
  url.hash = '';
  return url.href;
}
export const inScope = (target, site) => {
  try { return new URL(target).hostname.replace(/^www\./i, '').toLowerCase() === new URL(site).hostname.replace(/^www\./i, '').toLowerCase(); }
  catch { return false; }
};

export async function resolvePublic(url, resolver = lookup) {
  const host = new URL(normalizeUrl(url)).hostname.replace(/^\[|\]$/g, '');
  const answers = isIP(host) ? [{ address: host, family: isIP(host) }] : await resolver(host, { all: true, verbatim: true });
  if (!answers.length || answers.some((answer) => !isPublicAddress(answer.address))) throw new AuditError('The hostname does not resolve exclusively to public addresses.');
  return answers.find((answer) => answer.family === 4) ?? answers[0];
}

/** A validated DNS result is pinned to the connection. No second DNS lookup and no automatic redirects. */
export async function safeGet(value, signal, { maxBytes = 2_000_000, resolver = lookup } = {}) {
  const url = new URL(normalizeUrl(value));
  const timeout = AbortSignal.any([signal, AbortSignal.timeout(15_000)]);
  timeout.throwIfAborted();
  const address = await abortable(resolvePublic(url.href, resolver), timeout);
  timeout.throwIfAborted();
  return new Promise((resolve, reject) => {
    const get = url.protocol === 'https:' ? https.get : http.get;
    const request = get(url, {
      agent: false, signal: timeout, family: address.family,
      lookup: (_host, options, callback) => options.all ? callback(null, [address]) : callback(null, address.address, address.family),
      headers: { 'User-Agent': BOT, Accept: 'text/html, application/xhtml+xml, application/xml, text/xml, text/plain;q=0.8', 'Accept-Encoding': 'gzip, deflate, br' },
    }, async (response) => {
      let stream = response;
      try {
        const status = response.statusCode ?? 0;
        const headers = response.headers;
        if (status >= 300 && status < 400) { resolve({ url: url.href, status, headers, text: '', bytes: 0 }); return; }
        if (Number(headers['content-length']) > maxBytes) throw new AuditError('Response exceeds the per-page size limit.');
        const encoding = String(headers['content-encoding'] ?? '').toLowerCase();
        if (encoding === 'gzip' || (!encoding && url.pathname.endsWith('.gz'))) stream = response.pipe(createGunzip());
        else if (encoding === 'deflate') stream = response.pipe(createInflate());
        else if (encoding === 'br') stream = response.pipe(createBrotliDecompress());
        else if (encoding && encoding !== 'identity') throw new AuditError('Unsupported response encoding.');
        // Propagate source errors to the decoder; pipe() alone does not forward them.
        response.on('error', (error) => stream.destroy(error));
        const chunks = [];
        let bytes = 0;
        let compressedBytes = 0;
        response.on('data', (chunk) => { compressedBytes += chunk.length; if (compressedBytes > maxBytes) response.destroy(new AuditError('Response exceeds the download limit.')); });
        for await (const chunk of stream) {
          timeout.throwIfAborted(); bytes += chunk.length;
          if (bytes > maxBytes) throw new AuditError('Decompressed response exceeds the per-page size limit.');
          chunks.push(chunk);
        }
        const buffer = Buffer.concat(chunks);
        const charset = /charset\s*=\s*["']?([^;\s"']+)/i.exec(String(headers['content-type'] ?? ''))?.[1]
          ?? /<meta[^>]+charset\s*=\s*["']?([^\s"'/>]+)/i.exec(buffer.subarray(0, 1024).toString('ascii'))?.[1] ?? 'utf-8';
        let text;
        try { text = new TextDecoder(charset).decode(buffer); } catch { text = buffer.toString('utf8'); }
        resolve({ url: url.href, status, headers, text, bytes });
      } catch (error) { reject(error); }
      finally { stream.destroy(); response.destroy(); request.destroy(); }
    });
    request.once('error', reject);
  });
}
export async function abortable(promise, signal) {
  signal.throwIfAborted();
  let listener;
  try {
    return await Promise.race([promise, new Promise((_, reject) => {
      listener = () => reject(signal.reason ?? new AuditError('Run cancelled.'));
      signal.addEventListener('abort', listener, { once: true });
    })]);
  } finally { if (listener) signal.removeEventListener('abort', listener); }
}
/** Serialises request start times, not whole responses; Crawl-delay is never shortened. */
export function createGate() {
  let queue = Promise.resolve(); let last = 0;
  return (delay, signal) => {
    const next = queue.then(async () => {
      signal.throwIfAborted();
      const wait = last + delay - Date.now();
      if (wait > 0) await sleep(wait, undefined, { signal });
      last = Date.now();
    });
    queue = next.catch(() => {});
    return next;
  };
}
