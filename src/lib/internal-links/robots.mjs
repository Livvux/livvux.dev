import { AuditError } from './network.mjs';

function octets(value) {
  return value.replace(/%([\da-f]{2})/gi, (_, hex) => {
    const ch = String.fromCharCode(parseInt(hex, 16)); return /[a-z\d._~-]/i.test(ch) ? ch : `%${hex.toUpperCase()}`;
  }).replace(/[^\x00-\x7f]/gu, (ch) => encodeURIComponent(ch));
}
// Iterative wildcard matching avoids regular-expression backtracking on untrusted rules.
export function globMatch(pattern, input) {
  let i = 0; let j = 0; let star = -1; let retry = 0;
  while (i < input.length) {
    if (pattern[j] === '*') { star = j++; retry = i; }
    else if (pattern[j] === input[i]) { i++; j++; }
    else if (star >= 0) { j = star + 1; i = ++retry; }
    else return false;
  }
  while (pattern[j] === '*') j++;
  return j === pattern.length;
}
export function parseRobots(text, agent = 'livvuxbot') {
  if (Buffer.byteLength(text) > 512_000) throw new AuditError('robots.txt exceeds the supported size; crawl stopped.');
  const groups = []; const sitemaps = []; let group = null; let hasDirectives = false;
  for (const raw of text.replace(/^\ufeff/, '').split(/\r?\n/)) {
    const line = raw.split('#')[0].trim(); const colon = line.indexOf(':'); if (colon < 0) continue;
    const key = line.slice(0, colon).trim().toLowerCase(); const value = line.slice(colon + 1).trim();
    if (key === 'sitemap') { if (value) sitemaps.push(value); continue; }
    if (key === 'user-agent') {
      if (!group || hasDirectives) { group = { agents: [], rules: [], delay: 0 }; groups.push(group); hasDirectives = false; }
      group.agents.push(value.toLowerCase()); continue;
    }
    if (!group) continue;
    if (['allow', 'disallow', 'crawl-delay'].includes(key)) hasDirectives = true;
    if (key === 'crawl-delay' && /^\d+(?:\.\d+)?$/.test(value)) group.delay = Math.max(group.delay, Number(value) * 1000);
    if (['allow', 'disallow'].includes(key) && value.startsWith('/')) {
      if (value.length > 2000 || (value.match(/\*/g) ?? []).length > 20 || group.rules.length > 5000) throw new AuditError('robots.txt rules exceed the supported complexity; crawl stopped.');
      const pattern = octets(value); const anchored = pattern.endsWith('$');
      group.rules.push({ allow: key === 'allow', length: Buffer.byteLength(pattern.replace(/\*/g, '').replace(/\$$/, '')), pattern: anchored ? pattern.slice(0, -1) : pattern + '*' });
    }
  }
  const strength = (g) => Math.max(-1, ...g.agents.map((name) => name === '*' ? 0 : name && agent.toLowerCase().includes(name) ? name.length : -1));
  const best = Math.max(-1, ...groups.map(strength)); const selected = groups.filter((g) => strength(g) === best && best >= 0);
  const rules = selected.flatMap((g) => g.rules);
  return { sitemaps: [...new Set(sitemaps)].slice(0, 32), delay: Math.max(200, ...selected.map((g) => g.delay)), allowed(url) {
    const parsed = new URL(url); const path = octets(parsed.pathname + parsed.search);
    const matches = rules.filter((rule) => globMatch(rule.pattern, path)).sort((a, b) => b.length - a.length || Number(b.allow) - Number(a.allow));
    return matches[0]?.allow ?? true;
  } };
}
/** No external entity expansion; XML <loc> text/CDATA only. */
export function sitemapLocations(xml) {
  if (/<!DOCTYPE|<!ENTITY/i.test(xml)) throw new AuditError('Sitemap document types and external entities are not supported.');
  const index = /<(?:[\w-]+:)?sitemapindex\b/i.test(xml);
  const matches = [...xml.matchAll(/<(?:[\w-]+:)?loc\b[^>]*>([\s\S]*?)<\/(?:[\w-]+:)?loc\s*>/gi)].slice(0, 5000);
  return { index, urls: matches.map((match) => match[1].replace(/^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/, '$1').replace(/&(amp|lt|gt|quot|apos);/g, (_, key) => ({ amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" })[key]).replace(/&#(x[\da-f]+|\d+);/gi, (_, value) => { const n = value[0].toLowerCase() === 'x' ? parseInt(value.slice(1), 16) : Number(value); return n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : ''; }).trim()) };
}
