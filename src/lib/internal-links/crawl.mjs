import { safeGet, normalizeUrl, inScope, createGate, AuditError } from './network.mjs';
import { parseRobots, sitemapLocations } from './robots.mjs';
import { extractPage } from './extract.mjs';

/** Each redirect is scope checked, DNS checked and checked against its own origin's robots policy. */
export async function crawl(site, signal, emit, { get = safeGet, maxPages = 500, maxBytes = 100_000_000, skipDelay = false } = {}) {
  const pages = []; const skipped = []; const warnings = new Set();
  const policies = new Map(); const gates = new Map(); const visited = new Set(); const queued = new Set();
  let downloaded = 0; let attempts = 0; let discovered = 0; let capped = false; let linkCount = 0;
  const warn = (message) => { if (warnings.size < 100) warnings.add(message); };
  const skip = (url, reason) => { if (skipped.length < 2000) skipped.push({ url, reason }); };
  const gate = (origin) => { if (!gates.has(origin)) gates.set(origin, createGate()); return gates.get(origin); };
  async function download(url, delay = 200) {
    signal.throwIfAborted();
    if (downloaded >= maxBytes) throw new AuditError('The total download limit was reached.');
    // Reserve before awaiting so concurrent responses cannot overrun the shared budget.
    // Failed downloads retain their reservation because their actual byte count is unknown.
    const reserved = Math.min(2_000_000, maxBytes - downloaded);
    downloaded += reserved;
    await gate(new URL(url).origin)(skipDelay ? 0 : delay, signal);
    const response = await get(url, signal, { maxBytes: reserved });
    downloaded -= reserved - Math.min(reserved, response.bytes ?? reserved);
    return response;
  }
  function policy(origin) {
    if (policies.has(origin)) return policies.get(origin);
    const pending = (async () => {
      let url = `${origin}/robots.txt`;
      for (let hops = 0; hops <= 5; hops++) {
        const response = await download(url);
        if ([301, 302, 303, 307, 308].includes(response.status)) {
          const target = normalizeUrl(String(response.headers.location ?? ''), url);
          if (!response.headers.location || !inScope(target, site) || new URL(target).pathname !== '/robots.txt') throw new AuditError('robots.txt redirected outside the supported crawl scope.');
          url = target; continue;
        }
        if ([401, 403].includes(response.status)) return { allowed: () => false, delay: 200, sitemaps: [] };
        if ([404, 410].includes(response.status)) return parseRobots('');
        if (response.status !== 200 || /^\s*(?:<!doctype html|<html)/i.test(response.text)) throw new AuditError('robots.txt could not be safely read; this origin was not crawled.');
        return parseRobots(response.text);
      }
      throw new AuditError('Too many robots.txt redirects.');
    })();
    policies.set(origin, pending); return pending;
  }
  async function resource(input) {
    let url = normalizeUrl(input);
    const seen = new Set();
    for (let hops = 0; hops <= 5; hops++) {
      if (!inScope(url, site)) throw new AuditError('Redirect outside this website was skipped.');
      if (seen.has(url)) throw new AuditError('Redirect loop was skipped.'); seen.add(url);
      const rules = await policy(new URL(url).origin);
      if (!rules.allowed(url)) throw new AuditError('Blocked by robots.txt.');
      const response = await download(url, rules.delay);
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        if (!response.headers.location) throw new AuditError('Redirect without a destination.');
        url = normalizeUrl(String(response.headers.location), url); continue;
      }
      return { ...response, url };
    }
    throw new AuditError('Too many redirects.');
  }
  emit({ event: 'stage', stage: 'robots', message: 'Reading robots.txt.' });
  const initial = await policy(new URL(site).origin);
  if (!initial.allowed(site)) throw new AuditError('LivvuxBot is not allowed to crawl this URL by robots.txt.');
  emit({ event: 'stage', stage: 'discover', message: 'Discovering sitemap URLs.' });
  const origin = new URL(site).origin;
  const sitemapQueue = [...initial.sitemaps, `${origin}/sitemap.xml`, `${origin}/sitemap_index.xml`, `${origin}/wp-sitemap.xml`];
  const sitemapSeen = new Set(); const pageQueue = [];
  function enqueue(value, base = site) {
    let url; try { url = normalizeUrl(value, base); } catch { return; }
    if (!inScope(url, site) || queued.has(url) || /\.(?:pdf|jpe?g|png|gif|webp|svg|zip|mp[34]|css|js|xml|gz|woff2?)(?:$|\?)/i.test(url)) return;
    if (queued.size >= 5000) { capped = true; return; }
    queued.add(url); pageQueue.push(url); discovered++;
  }
  enqueue(site);
  let sitemapPages = 0;
  while (sitemapQueue.length && sitemapSeen.size < 32) {
    signal.throwIfAborted();
    let url;
    try { url = normalizeUrl(sitemapQueue.shift(), site); } catch { continue; }
    if (!inScope(url, site)) { warn('An external sitemap was skipped; only the entered website and its www alias are crawled.'); continue; }
    if (sitemapSeen.has(url)) continue; sitemapSeen.add(url);
    try {
      const response = await resource(url);
      if (response.status !== 200) continue;
      const parsed = sitemapLocations(response.text);
      if (parsed.index) { for (const target of parsed.urls) { if (sitemapQueue.length < 100) sitemapQueue.push(target); else capped = true; } }
      else for (const target of parsed.urls) { enqueue(target, response.url); sitemapPages++; }
    } catch (error) { signal.throwIfAborted(); warn(error instanceof AuditError ? error.message : 'A sitemap could not be fetched.'); }
  }
  if (sitemapQueue.length) { capped = true; warn('The sitemap limit was reached; coverage is partial.'); }
  const followLinks = sitemapPages === 0;
  if (followLinks) warn('No usable sitemap was found. Following links from the entered URL instead.');
  emit({ event: 'stage', stage: 'fetch', message: 'Fetching HTML pages.', total: Math.min(pageQueue.length, maxPages) });
  while (pageQueue.length && attempts < maxPages && downloaded < maxBytes) {
    const batch = pageQueue.splice(0, Math.min(4, maxPages - attempts)); attempts += batch.length;
    await Promise.all(batch.map(async (url) => {
      if (visited.has(url)) return; visited.add(url);
      try {
        const response = await resource(url);
        if (response.status !== 200) { skip(url, `HTTP ${response.status}`); return; }
        const type = String(response.headers['content-type'] ?? '');
        if (!/^(text\/html|application\/xhtml\+xml)(?:;|$)/i.test(type)) { skip(url, 'Not an HTML response.'); return; }
        if (response.url !== url && visited.has(response.url)) return;
        visited.add(response.url);
        const page = extractPage(response.text, response.url, response.headers);
        page.aliases = url === response.url ? [] : [url];
        if (page.truncated) warn('Some page text exceeded 40,000 characters; those pages were analysed only up to that limit.');
        if (page.links.length >= 2000) warn('Some pages reached the 2,000-link extraction limit.');
        if (linkCount + page.links.length > 200_000) { page.links = page.links.slice(0, Math.max(0, 200_000 - linkCount)); capped = true; }
        linkCount += page.links.length;
        if (followLinks && !page.nofollow) for (const link of page.links) if (!link.nofollow) enqueue(link.target);
        pages.push(page);
        emit({ event: 'page', url: page.url, title: page.title, pages: pages.length });
      } catch (error) {
        signal.throwIfAborted(); skip(url, error instanceof AuditError ? error.message : 'Fetch failed or timed out.');
      }
    }));
  }
  if (pageQueue.length || downloaded >= maxBytes) { capped = true; warn('The crawl limit was reached; inbound counts cover only the fetched sample.'); }
  if (!pages.length) throw new AuditError('No HTML pages could be read. Check robots.txt, your firewall, and the website URL.');
  return { pages, skipped, warnings: [...warnings], partial: capped || skipped.length > 0 || warnings.size > 0, coverage: { discovered, attempted: attempts, fetched: pages.length, sitemapFiles: sitemapSeen.size, downloadBudgetUsedBytes: downloaded, maxPages, javascriptRendered: false } };
}

/** Collapse only canonicals whose targets were fetched. A canonical cycle retains one deterministic representative. */
export function canonicalize(pages) {
  const byUrl = new Map(pages.map((page) => [page.url, page])); const aliases = new Map();
  function representative(url) {
    const chain = [];
    while (byUrl.has(url)) {
      if (chain.includes(url)) return chain.slice(chain.indexOf(url)).sort()[0];
      chain.push(url); const target = byUrl.get(url).canonical;
      if (!target || target === url || !byUrl.has(target)) return url;
      url = target;
    }
    return chain.at(-1);
  }
  for (const page of pages) {
    aliases.set(page.url, representative(page.url));
    for (const alias of page.aliases) aliases.set(alias, representative(page.url));
  }
  const kept = pages.filter((page) => aliases.get(page.url) === page.url);
  const links = kept.flatMap((page) => page.links.map((link) => ({ ...link, target: aliases.get(link.target) ?? link.target })));
  return { pages: kept, links, aliases };
}
