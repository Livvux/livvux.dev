"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { label, readEvents, reportCsv, STAGES, STAGE_LABELS } from "@/lib/internal-links/shared.mjs";
import type { AuditEvent, Report, Suggestion, Usage } from "@/lib/internal-links/types";
import styles from "./internal-links.module.css";

const initialUsage: Usage = { requests: 0, inputTokens: 0, outputTokens: 0, cost: 0, model: "jev-1.13.0", estimated: true };
const initialProgress = { stage: "robots", message: "", pages: 0, classified: 0, judged: 0, found: 0, tally: {} as Record<string, number>, feed: [] as string[], latest: null as Suggestion | null, usage: initialUsage };
const percent = (value: number) => `${Math.round(value * 100)}%`;
function path(url: string) { try { const parsed = new URL(url); return decodeURI(parsed.pathname + parsed.search) || "/"; } catch { return url; } }
function PageLink({ url }: { url: string }) { return <a href={url} target="_blank" rel="noopener noreferrer" title={url} className={styles.url}>{path(url)}</a>; }
function download(content: string, type: string, filename: string) {
  const href = URL.createObjectURL(new Blob([content], { type }));
  const element = document.createElement("a"); element.href = href; element.download = filename; document.body.append(element); element.click(); element.remove();
  window.setTimeout(() => URL.revokeObjectURL(href), 1000);
}
function Table({ headings, children }: { headings: string[]; children: ReactNode }) {
  return <div className={styles.tableScroll} tabIndex={0} role="region" aria-label="Scrollable report table"><table><thead><tr>{headings.map((heading) => <th key={heading} scope="col">{heading}</th>)}</tr></thead><tbody>{children}</tbody></table></div>;
}
function Results({ report }: { report: Report }) {
  const [tab, setTab] = useState("map"); const [query, setQuery] = useState(""); const [page, setPage] = useState(0);
  const tabs = [{ id: "map", name: "Link map", count: report.weakPages.length }, { id: "suggestions", name: "Recommended links", count: report.suggestions.length }, { id: "pages", name: "Pages", count: report.pages.length }, { id: "anchors", name: "Generic anchors", count: report.genericAnchors.length }, { id: "links", name: "Existing links", count: report.links.length }];
  const matches = (values: string[]) => values.join(" ").toLocaleLowerCase().includes(query.toLocaleLowerCase());
  const weak = report.weakPages.filter((row) => matches([row.url, row.title, ...row.sources]));
  const suggestions = report.suggestions.filter((row) => matches([row.source, row.target, row.anchor, row.sentence, row.role]));
  const pages = report.pages.filter((row) => matches([row.url, row.title, row.type, row.intent]));
  const links = (tab === "anchors" ? report.genericAnchors : report.links).filter((row) => matches([row.source, row.target, row.anchor]));
  const total = tab === "map" ? weak.length : tab === "suggestions" ? suggestions.length : tab === "pages" ? pages.length : links.length;
  const current = Math.min(page, Math.max(0, Math.ceil(total / 50) - 1));
  const slice = <T,>(rows: T[]) => rows.slice(current * 50, (current + 1) * 50);
  const host = new URL(report.site).hostname.replace(/[^a-z\d.-]/gi, "_");
  return <section className={styles.results} aria-labelledby="report-heading">
    <div className={styles.toolbar}><div><h2 id="report-heading">Your internal link report</h2><p>{report.pages.length} canonical pages · {report.suggestions.length} recommended links</p></div><div className={styles.actions}>
      <button type="button" onClick={() => download(reportCsv(report), "text/csv;charset=utf-8", `internal-links-${host}.csv`)}>Download CSV</button>
      <button type="button" onClick={() => download(JSON.stringify(report, null, 2), "application/json", `internal-links-${host}.json`)}>Download JSON</button>
    </div></div>
    <p className={styles.note}>Inbound counts mean unique source pages in this crawl, not the whole web. Zero links in this sample does not prove that a page is an orphan. Review suggestions before editing your site.</p>
    {(report.partial || report.warnings.length > 0) && <details className={styles.notice}><summary>Coverage notes{report.partial ? " — partial crawl" : ""}</summary><ul>{report.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul>{report.skipped.length > 0 && <p>{report.skipped.length} URLs were skipped. Reasons are included in both downloads.</p>}</details>}
    <div className={styles.tabs} aria-label="Report sections">{tabs.map((item) => <button type="button" key={item.id} aria-pressed={tab === item.id} onClick={() => { setTab(item.id); setPage(0); }}>{item.name} <span>{item.count}</span></button>)}</div>
    <label className={styles.search}>Filter report<input type="search" value={query} placeholder="Search URLs, anchors, or page types…" onChange={(event) => { setQuery(event.target.value); setPage(0); }} /></label>
    {total === 0 ? <p className={styles.empty}>{query ? "No matching results." : "No results in this section. The tool does not invent links to fill the report."}</p> : <>
      {tab === "map" && <Table headings={["Weak page", "Contextual links in", "Recommended source pages"]}>{slice(weak).map((row) => <tr key={row.url}><td><PageLink url={row.url} /><small>{row.title}</small></td><td>{row.incomingContextual}</td><td>{row.sources.length ? <ul>{row.sources.map((source) => <li key={source}><PageLink url={source} /></li>)}</ul> : "No suitable source found."}</td></tr>)}</Table>}
      {tab === "suggestions" && <Table headings={["Source → target", "Sentence and anchor", "Role", "Confidence"]}>{slice(suggestions).map((row) => <tr key={`${row.source}:${row.target}`}><td><PageLink url={row.source} /><span className={styles.direction}>→</span><PageLink url={row.target} /></td><td><p>{row.sentence.slice(0, row.anchorStart)}<mark>{row.anchor}</mark>{row.sentence.slice(row.anchorStart + row.anchor.length)}</p><small>Anchor: {row.anchor}</small></td><td>{label(row.role)}</td><td>{percent(row.probability)}<small>Placement: {percent(row.placementConfidence)}</small></td></tr>)}</Table>}
      {tab === "pages" && <Table headings={["Page", "Type / intent", "Words", "Contextual in", "Total in", "Suggested in / out"]}>{slice(pages).map((row) => <tr key={row.url}><td><PageLink url={row.url} /><small>{row.title}{row.noindex ? " · noindex" : ""}</small></td><td>{label(row.type)}<small>{row.intent}</small></td><td>{row.wordCount.toLocaleString()}</td><td>{row.incomingContextual}</td><td>{row.incoming}</td><td>{row.suggestedIn} / {row.suggestedOut}</td></tr>)}</Table>}
      {(tab === "anchors" || tab === "links") && <Table headings={["Source", "Target", "Anchor text", "Location"]}>{slice(links).map((row, i) => <tr key={`${current}:${i}`}><td><PageLink url={row.source} /></td><td><PageLink url={row.target} /></td><td>{row.anchor || "(empty anchor)"}</td><td>{row.contextual ? "Contextual" : "Navigation / other"}{row.nofollow && <small>nofollow</small>}</td></tr>)}</Table>}
    </>}
    <div className={styles.pagination}><p>{total ? `${current * 50 + 1}–${Math.min((current + 1) * 50, total)} of ${total}` : "0 results"}</p><div className={styles.actions}><button type="button" disabled={current === 0} onClick={() => setPage(current - 1)}>Previous</button><button type="button" disabled={(current + 1) * 50 >= total} onClick={() => setPage(current + 1)}>Next</button></div></div>
  </section>;
}

export default function InternalLinks() {
  const [url, setUrl] = useState(""); const keyInput = useRef<HTMLInputElement>(null); const controller = useRef<AbortController | null>(null);
  const [busy, setBusy] = useState(false); const [error, setError] = useState(""); const [report, setReport] = useState<Report | null>(null);
  const [progress, setProgress] = useState(initialProgress); const [elapsed, setElapsed] = useState(0);
  const resultStart = useRef<HTMLDivElement>(null);
  useEffect(() => () => controller.current?.abort(), []);
  async function run(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (controller.current || !keyInput.current?.value.trim()) return;
    const abort = new AbortController(); controller.current = abort;
    let requestKey = keyInput.current.value.trim(); keyInput.current.value = "";
    setBusy(true); setError(""); setReport(null); setProgress(initialProgress); setElapsed(0);
    const started = Date.now(); const timer = window.setInterval(() => setElapsed(Math.floor((Date.now() - started) / 1000)), 1000);
    let completed = false; let streamError = "";
    const receive = (event: AuditEvent) => {
      if (event.event === "report") { completed = true; setReport(event.report); return; }
      if (event.event === "error") { streamError = event.message; return; }
      if (event.event === "heartbeat") return;
      setProgress((previous) => {
        if (event.event === "stage") return { ...previous, stage: event.stage, message: event.message };
        if (event.event === "usage") return { ...previous, usage: event.usage };
        if (event.event === "page") return { ...previous, pages: event.pages, feed: [`Read ${path(event.url)}`, ...previous.feed].slice(0, 40) };
        if (event.event === "class") return { ...previous, classified: event.classified, tally: event.tally, feed: [`${label(event.pageType)} · ${path(event.url)}`, ...previous.feed].slice(0, 40) };
        return { ...previous, judged: event.judged, found: event.found, latest: event.accepted ? event : previous.latest, feed: [`${event.accepted ? "✓" : "✗"} ${path(event.source)} → ${path(event.target)} · ${percent(event.probability)}`, ...previous.feed].slice(0, 40) };
      });
    };
    try {
      const pending = fetch("/api/tools/internal-links", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url, key: requestKey }), signal: abort.signal, cache: "no-store" });
      requestKey = "";
      const response = await pending;
      if (!response.ok) { const result = await response.json().catch(() => null); throw new Error(result?.error ?? `The server returned HTTP ${response.status}.`); }
      resultStart.current?.scrollIntoView({ block: "start", behavior: "auto" });
      await readEvents(response, receive);
      if (streamError) throw new Error(streamError);
      if (!completed) throw new Error("The connection ended before a complete report arrived. No complete report was produced.");
    } catch (cause) { setError(abort.signal.aborted ? "Run cancelled. Already processed TypeSafe requests may still be billed by TypeSafe." : cause instanceof Error ? cause.message : "The audit could not be completed."); }
    finally { requestKey = ""; window.clearInterval(timer); setElapsed(Math.floor((Date.now() - started) / 1000)); controller.current = null; setBusy(false); }
  }
  const activeStage = STAGES.indexOf(progress.stage);
  return <section className={styles.tool} aria-label="Internal link analysis">
    <form onSubmit={run} className={styles.form} autoComplete="off">
      <label htmlFor="audit-site">Site URL<input id="audit-site" type="text" inputMode="url" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://example.com" required maxLength={500} disabled={busy} spellCheck={false} autoCapitalize="off" /></label>
      <label htmlFor="audit-key">TypeSafe API key <span>(required, never saved)</span><input id="audit-key" ref={keyInput} type="password" required maxLength={200} placeholder="Your TypeSafe API key" disabled={busy} autoComplete="new-password" spellCheck={false} autoCapitalize="off" data-1p-ignore="true" data-lpignore="true" data-bwignore="true" /></label>
      <div className={styles.actions}><button type="submit" className={styles.primary} disabled={busy}>{busy ? "Running…" : "Analyse internal links"}</button>{busy && <button type="button" onClick={() => controller.current?.abort()}>Cancel</button>}</div>
      <p className={styles.note}>Free to use with your own key. TypeSafe charges your account for API usage. Running an audit sends extracted page text to TypeSafe; only audit sites you are authorised to crawl.</p>
      {error && <p role="alert" className={styles.error}>{error}</p>}
    </form>
    {(busy || report || progress.pages > 0) && <div ref={resultStart} className={styles.progress}>
      <dl className={styles.counters}>{[["Pages read", progress.pages], ["Classified", progress.classified], ["Links judged", progress.judged], ["Links found", progress.found], ["Jev requests", progress.usage.requests], ["Elapsed", `${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, "0")}`], ["Cost so far", `$${progress.usage.cost.toFixed(3)}`]].map(([name, value]) => <div key={name}><dt>{name}</dt><dd>{value}</dd></div>)}</dl>
      <p className={styles.note}>Cost is an estimate from reported input tokens, not a billing total.</p>
      <ol className={styles.stages} aria-label="Audit stages">{STAGES.map((stage, i) => <li key={stage} data-state={report || i < activeStage ? "done" : i === activeStage && busy ? "active" : "pending"}><span aria-hidden="true" />{STAGE_LABELS[i]}</li>)}</ol>
      <p role="status" className={styles.note}>{busy ? progress.message : report ? "Report complete. Download it before leaving this page." : "Run stopped."}</p>
      {busy && <div className={styles.live}>
        <div><h3>Live feed</h3><ol className={styles.feed} aria-label="Recently processed pages and links">{progress.feed.map((row, i) => <li key={`${row}:${i}`}>{row}</li>)}</ol></div>
        <div><h3>Latest link found</h3><div className={styles.latest}>{progress.latest ? <><p><PageLink url={progress.latest.source} /> → <PageLink url={progress.latest.target} /></p><dl><dt>Link</dt><dd>{percent(progress.latest.probability)}</dd><dt>Role</dt><dd>{label(progress.latest.role)}</dd><dt>Anchor</dt><dd>{progress.latest.anchor}</dd></dl></> : <p className={styles.note}>Accepted links appear here once pages are classified.</p>}
        {Object.keys(progress.tally).length > 0 && <div className={styles.tally}><h4>Page types</h4>{Object.entries(progress.tally).sort((a, b) => b[1] - a[1]).map(([type, count]) => <div key={type}><span>{label(type)}</span><meter min={0} max={Math.max(1, progress.classified)} value={count} aria-label={label(type)} /><span>{count}</span></div>)}</div>}</div></div>
      </div>}
    </div>}
    {report && <Results report={report} />}
    <p className={`${styles.note} ${styles.bottomNote}`}>Up to 500 HTML pages, subject to crawl and runtime limits. The crawler obeys robots.txt and Crawl-delay. Your key and crawl data are not saved by this application; the report remains in this browser tab until you leave or reload.</p>
  </section>;
}
