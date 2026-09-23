/** Browser-safe report helpers. Never import the crawler into a client component. */
export const PAGE_TYPES = {
  pillar_guide: 'Long, broad articles that should link out to many narrower pages.',
  support_article: 'A focused article or post like a tutorial or explainer.',
  product_or_service: 'A page selling or describing a product or service.',
  comparison_or_review: 'A comparison, product review, or best-of list.',
  glossary_or_definition: 'A page defining a term or concept.',
  tool_or_calculator: 'An interactive tool or calculator.',
  news_or_update: 'A dated announcement or changelog entry.',
  category_hub: 'An archive, listing, tag, category, or index.',
  home: 'The website home page.',
  about_or_company: 'Information about a person or company.',
  legal_or_utility: 'Privacy, terms, account, login, or other utility page.',
  other: 'None of these page types.',
};
export const INTENTS = {
  informational: 'Learn about something.', commercial: 'Research or compare a purchase.',
  transactional: 'Buy, book, download, or complete an action.', navigational: 'Find a specific website or page.',
};
export const ROLES = {
  explains_concept: 'The target explains a term or idea the source mentions.',
  deeper_detail: 'The target goes deeper into a sub-topic the source only touches on.',
  broader_guide: 'The target is the broader guide the source belongs under.',
  next_step: 'The target is what a reader should read or do next.',
  product_or_service: 'The target is the product or service that solves the problem discussed.',
  comparison_or_alternative: 'The target compares or offers an alternative to what the source discusses.',
};
export const STAGES = ['robots', 'discover', 'fetch', 'classify', 'judge', 'report'];
export const STAGE_LABELS = ['robots.txt', 'Sitemap', 'Fetch', 'Classify', 'Judge', 'Report'];
export const label = (value) => String(value ?? '').replaceAll('_', ' ');
export const isGenericAnchor = (value) => /^(click here|here|read more|learn more|more|link|website|this page|hier|mehr|mehr erfahren|weiterlesen|clique aqui|saiba mais|en savoir plus|cliquez ici|leer más|haz clic aquí)[.!…\s]*$/iu.test(value.trim());

/** Quote every cell and neutralise spreadsheet formula injection, including leading whitespace. */
export function csvCell(value) {
  let text = value == null ? '' : typeof value === 'object' ? JSON.stringify(value) : String(value);
  if (/^[\s\u0000-\u001f]*[=+@-]/u.test(text) || /^[\t\r\n]/u.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}
export function toCsv(rows, columns) {
  return '\ufeff' + [columns.map(csvCell).join(','), ...rows.map((row) => columns.map((key) => csvCell(row[key])).join(','))].join('\r\n');
}
export function reportCsv(report) {
  const rows = [
    ...report.pages.map((page) => ({ record: 'page', ...page })),
    ...report.links.map((link) => ({ record: 'existing_link', ...link })),
    ...report.suggestions.map((link) => ({ record: 'suggestion', ...link })),
    ...report.genericAnchors.map((link) => ({ record: 'generic_anchor', ...link })),
    ...report.weakPages.map((page) => ({ record: 'weak_page', ...page })),
    ...report.skipped.map((page) => ({ record: 'skipped', ...page })),
    ...report.warnings.map((message) => ({ record: 'warning', message })),
    { record: 'metadata', site: report.site, generatedAt: report.generatedAt, partial: report.partial, usage: report.usage, coverage: report.coverage },
  ];
  return toCsv(rows, ['record', 'url', 'title', 'type', 'intent', 'language', 'wordCount', 'noindex', 'truncated', 'incoming', 'incomingContextual', 'outgoing', 'suggestedIn', 'suggestedOut', 'source', 'target', 'anchor', 'anchorStart', 'sentence', 'role', 'probability', 'placementConfidence', 'contextual', 'nofollow', 'sources', 'reason', 'message', 'site', 'generatedAt', 'partial', 'usage', 'coverage']);
}

/** Correctly retains incomplete UTF-8 characters AND incomplete NDJSON frames between reads. */
export async function readEvents(response, onEvent) {
  if (!response.body) throw new Error('The server did not return a report stream.');
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let pending = '';
  try {
    while (true) {
      const { value, done } = await reader.read();
      pending += decoder.decode(value, { stream: !done });
      let newline;
      while ((newline = pending.indexOf('\n')) >= 0) {
        const line = pending.slice(0, newline).trim();
        pending = pending.slice(newline + 1);
        if (line) onEvent(JSON.parse(line));
      }
      if (pending.length > 32_000_000) throw new Error('The report exceeds the browser size limit.');
      if (done) break;
    }
    if (pending.trim()) onEvent(JSON.parse(pending));
  } finally { await reader.cancel().catch(() => {}); reader.releaseLock(); }
}
