import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Tools", description: "Practical tools for websites and development. Audit internal links with your own TypeSafe API key.", alternates: { canonical: "/tools" } };
export default function ToolsPage() {
  return <main className="space-y-8">
    <header className="space-y-3"><Link href="/" className="text-sm text-muted-foreground">Livvux</Link><h1 className="text-3xl font-semibold tracking-tight">Tools</h1><p className="text-muted-foreground">Practical tools for your website.</p></header>
    <section className="border-y border-border py-6 space-y-3"><h2 className="text-xl font-medium"><Link href="/tools/internal-links" className="underline underline-offset-4">Internal links tool</Link></h2><p className="leading-relaxed text-muted-foreground">Crawl up to 500 HTML pages, find weak pages, and get contextual link suggestions with real anchors and placement. Download the report as CSV or JSON.</p><p className="text-sm text-muted-foreground">Free to use. Bring your own TypeSafe API key; provider usage charges apply.</p></section>
  </main>;
}
