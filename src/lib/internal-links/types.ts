export interface Usage { requests: number; inputTokens: number; outputTokens: number; cost: number; model: string; estimated: boolean }
export interface ExistingLink { source: string; target: string; anchor: string; contextual: boolean; nofollow: boolean }
export interface Suggestion { source: string; target: string; anchor: string; anchorStart: number; sentence: string; role: string; probability: number; placementConfidence: number }
export interface PageRow { url: string; title: string; type: string; intent: string; language: string; wordCount: number; incoming: number; incomingContextual: number; outgoing: number; suggestedIn: number; suggestedOut: number; noindex: boolean; truncated: boolean }
export interface Report {
  site: string; generatedAt: string; partial: boolean; coverage: { discovered: number; attempted: number; fetched: number; canonicalPages: number; linksJudged: number; sitemapFiles: number; downloadBudgetUsedBytes: number; maxPages: number; javascriptRendered: boolean };
  usage: Usage; pages: PageRow[]; links: ExistingLink[]; suggestions: Suggestion[]; weakPages: (PageRow & { sources: string[] })[]; genericAnchors: ExistingLink[]; skipped: { url: string; reason: string }[]; warnings: string[];
}
export type AuditEvent =
  | { event: "stage"; stage: string; message: string; total?: number }
  | { event: "page"; url: string; title: string; pages: number }
  | { event: "class"; url: string; pageType: string; intent: string; classified: number; tally: Record<string, number> }
  | ({ event: "link"; accepted: boolean; judged: number; found: number } & Suggestion)
  | { event: "usage"; usage: Usage }
  | { event: "report"; report: Report }
  | { event: "error"; message: string }
  | { event: "heartbeat" };
