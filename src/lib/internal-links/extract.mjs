import { decodeEntities } from './entities.mjs';
import { normalizeUrl, inScope, AuditError } from './network.mjs';

const VOID = new Set('area base br col embed hr img input link meta param source track wbr'.split(' '));
const BLOCK = new Set('address article aside blockquote div dl dt dd fieldset figcaption figure footer form h1 h2 h3 h4 h5 h6 header hr li main nav ol p pre section table td th tr ul'.split(' '));
const OMIT = new Set('script style template noscript svg canvas'.split(' '));
const CHROME = new Set('nav footer aside'.split(' '));
const clean = (text) => text.replace(/\s+/gu, ' ').trim();

/** Bounded, non-executing HTML tokenizer. Quotes, entities, raw-text elements and omitted p/li ends are handled. */
export function parseHtml(html) {
  const root = { tag: '#root', attrs: {}, children: [], parent: null };
  const stack = [root]; let cursor = 0; let nodes = 0;
  while (cursor < html.length) {
    if (++nodes > 80_000) throw new AuditError('HTML exceeds the parser node limit.');
    const parent = stack.at(-1);
    if (html.startsWith('<!--', cursor)) { const end = html.indexOf('-->', cursor + 4); cursor = end < 0 ? html.length : end + 3; continue; }
    if (html[cursor] !== '<') {
      const end = html.indexOf('<', cursor);
      parent.children.push({ tag: '#text', text: decodeEntities(html.slice(cursor, end < 0 ? html.length : end)), parent });
      cursor = end < 0 ? html.length : end; continue;
    }
    const start = cursor++;
    let quote = '';
    while (cursor < html.length) {
      const ch = html[cursor++];
      if (quote) { if (ch === quote) quote = ''; }
      else if (ch === '"' || ch === "'") quote = ch;
      else if (ch === '>') break;
    }
    const raw = html.slice(start, cursor);
    const name = /^<\s*(\/?)\s*([a-z][a-z\d:-]*)/i.exec(raw);
    if (!name) { if (!/^<!|^<\?/u.test(raw)) parent.children.push({ tag: '#text', text: raw, parent }); continue; }
    const tag = name[2].toLowerCase();
    if (name[1]) {
      const index = stack.findLastIndex((node) => node.tag === tag);
      if (index > 0) stack.length = index;
      continue;
    }
    // Common optional-end-tag cases. This is an audit parser, not a JS/browser renderer.
    if ((tag === 'li' && stack.at(-1).tag === 'li') || (BLOCK.has(tag) && stack.at(-1).tag === 'p')) stack.pop();
    const attrs = {};
    const attributes = raw.slice(name[0].length).replace(/\/?\s*>$/, '');
    for (const match of attributes.matchAll(/([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)) {
      const key = match[1].toLowerCase();
      if (!Object.hasOwn(attrs, key)) attrs[key] = decodeEntities(match[2] ?? match[3] ?? match[4] ?? '', true);
    }
    const node = { tag, attrs, children: [], parent: stack.at(-1) };
    node.parent.children.push(node);
    if (OMIT.has(tag)) {
      const closer = new RegExp(`</${tag}\\s*>`, 'ig'); closer.lastIndex = cursor;
      const match = closer.exec(html); cursor = match ? closer.lastIndex : html.length; continue;
    }
    if (!VOID.has(tag)) {
      if (stack.length >= 128) throw new AuditError('HTML exceeds the nesting limit.');
      stack.push(node);
    }
  }
  return root;
}
function visit(node, fn) { fn(node); for (const child of node.children ?? []) visit(child, fn); }
function textOf(node) { if (node.tag === '#text') return node.text; if (OMIT.has(node.tag) || Object.hasOwn(node.attrs, 'hidden') || node.attrs['aria-hidden'] === 'true') return ''; return (node.children ?? []).map(textOf).join(node.tag === 'br' || BLOCK.has(node.tag) ? ' ' : ''); }
function ancestor(node, predicate) { for (let at = node; at; at = at.parent) if (predicate(at)) return true; return false; }
export function words(text, language) {
  let segmenter;
  try { segmenter = new Intl.Segmenter(language || undefined, { granularity: 'word' }); } catch { segmenter = new Intl.Segmenter(undefined, { granularity: 'word' }); }
  return [...segmenter.segment(text)].filter((word) => word.isWordLike).map((word) => ({ text: word.segment, index: word.index, term: word.segment.toLocaleLowerCase() }));
}

export function extractPage(html, url, headers = {}) {
  const root = parseHtml(html); const elements = [];
  visit(root, (node) => { if (node.tag !== '#text') elements.push(node); });
  const first = (tag) => elements.find((node) => node.tag === tag);
  const metas = elements.filter((node) => node.tag === 'meta');
  const body = first('body') ?? root;
  const content = first('main') ?? elements.find((node) => node.attrs.role === 'main') ?? first('article') ?? body;
  const hidden = (node) => Object.hasOwn(node.attrs ?? {}, 'hidden') || node.attrs?.['aria-hidden'] === 'true';
  const chrome = (node) => CHROME.has(node.tag) || ['navigation', 'banner', 'contentinfo'].includes(node.attrs?.role) || (node.tag === 'header' && node.parent === body);
  const contextual = (node) => ancestor(node, (at) => at === content) && !ancestor(node, (at) => OMIT.has(at.tag) || hidden(at) || chrome(at));
  let base = url;
  try { const candidate = normalizeUrl(first('base')?.attrs.href ?? url, url); if (inScope(candidate, url)) base = candidate; } catch { /* Ignore unsafe base. */ }
  let canonical = url;
  const canon = elements.find((node) => node.tag === 'link' && /(?:^|\s)canonical(?:\s|$)/i.test(node.attrs.rel ?? ''));
  try { const candidate = normalizeUrl(canon?.attrs.href ?? url, base); if (inScope(candidate, url)) canonical = candidate; } catch { /* Keep fetched URL. */ }
  const language = first('html')?.attrs.lang?.slice(0, 35) ?? '';
  const robots = [String(headers['x-robots-tag'] ?? ''), ...metas.filter((node) => ['robots', 'livvuxbot'].includes((node.attrs.name ?? '').toLowerCase())).map((node) => node.attrs.content ?? '')].join(',');
  const noindex = /\b(noindex|none)\b/i.test(robots); const nofollow = /\b(nofollow|none)\b/i.test(robots);
  const links = [];
  for (const node of elements) {
    if (node.tag !== 'a' || !node.attrs.href || ancestor(node, hidden)) continue;
    let target;
    try { target = normalizeUrl(node.attrs.href, base); } catch { continue; }
    if (!inScope(target, url)) continue;
    let anchor = clean(textOf(node));
    if (!anchor) { const image = node.children.find((child) => child.tag === 'img'); anchor = clean(image?.attrs.alt ?? node.attrs['aria-label'] ?? ''); }
    links.push({ source: url, target, anchor: anchor.slice(0, 400), contextual: contextual(node), nofollow: nofollow || /\b(nofollow|sponsored|ugc)\b/i.test(node.attrs.rel ?? '') });
    if (links.length >= 2000) break;
  }
  // Preserve linked spans in normalised visible text so suggestions cannot create nested anchors.
  let text = ''; const linked = []; let truncated = false;
  function append(value) { if (text.length >= 40_000) { truncated = true; return; } text += value.slice(0, 40_000 - text.length); }
  function render(node) {
    if (OMIT.has(node.tag) || hidden(node) || chrome(node)) return;
    if (node.tag === '#text') { append(node.text.replace(/\s+/gu, ' ')); return; }
    const block = BLOCK.has(node.tag) || node.tag === 'br';
    if (block && text && !text.endsWith('\n')) append('\n');
    const start = text.length;
    for (const child of node.children ?? []) render(child);
    if (node.tag === 'a') linked.push({ start, end: text.length });
    if (block && text && !text.endsWith('\n')) append('\n');
  }
  render(content);
  let segmenter;
  try { segmenter = new Intl.Segmenter(language || undefined, { granularity: 'sentence' }); } catch { segmenter = new Intl.Segmenter(undefined, { granularity: 'sentence' }); }
  const sentences = []; let offset = 0;
  for (const paragraph of text.split('\n')) {
    for (const segment of segmenter.segment(paragraph)) {
      const leading = segment.segment.length - segment.segment.trimStart().length;
      const sentence = segment.segment.trim(); const start = offset + segment.index + leading;
      if (sentence.length < 20 || sentence.length > 1000) continue;
      sentences.push({ text: sentence, linked: linked.filter((span) => span.end > start && span.start < start + sentence.length).map((span) => ({ start: Math.max(0, span.start - start), end: Math.min(sentence.length, span.end - start) })) });
      if (sentences.length >= 500) break;
    }
    offset += paragraph.length + 1;
    if (sentences.length >= 500) break;
  }
  return { url, canonical, title: clean(textOf(first('title') ?? first('h1') ?? { tag: '#text', text: new URL(url).pathname })).slice(0, 300), language, noindex, nofollow, text: text.trim(), wordCount: words(text, language).length, sentences, links, truncated };
}
