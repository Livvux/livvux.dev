import Link from "next/link";
import { pageMetadata } from "@/lib/seo";
import { Breadcrumbs } from "@/components/breadcrumbs";

export const metadata = pageMetadata({
  title: "Website & SEO Tools",
  description: "Practical tools for websites and development. Audit internal links with your own TypeSafe API key and export actionable CSV or JSON reports.",
  path: "/tools",
});

export default function ToolsPage() {
  return (
    <main className="space-y-8">
      <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Tools", href: "/tools" }]} />
      <header className="space-y-3"><h1 className="text-3xl font-semibold tracking-tight">Website & SEO tools</h1><p className="text-muted-foreground">Practical tools for your website.</p></header>
      <section className="border-y border-border py-6 space-y-3">
        <h2 className="text-xl font-medium"><Link href="/tools/internal-links" className="underline underline-offset-4">Internal link checker and audit</Link></h2>
        <p className="leading-relaxed text-muted-foreground">Crawl up to 500 HTML pages, find weak pages, and get contextual link suggestions with real anchors and placement. Download the report as CSV or JSON.</p>
        <p className="text-sm text-muted-foreground">Free to use. Bring your own TypeSafe API key; provider usage charges apply.</p>
        <p className="text-sm"><Link href="/tools/crawler" className="underline underline-offset-4">How LivvuxBot crawls websites and respects robots.txt</Link></p>
      </section>
      <p className="text-sm text-muted-foreground">For tutorials and development notes, visit the <Link href="/blog" className="underline underline-offset-4">blog</Link>.</p>
    </main>
  );
}
