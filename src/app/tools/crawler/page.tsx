import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "LivvuxBot crawler", description: "How the internal links tool crawls websites, follows robots.txt, and limits requests.", alternates: { canonical: "/tools/crawler" } };
export default function CrawlerPage() {
  return <main className="space-y-6">
    <Link href="/tools/internal-links" className="text-sm underline underline-offset-4">Internal links tool</Link>
    <h1 className="text-3xl font-semibold tracking-tight">LivvuxBot</h1>
    <p className="leading-relaxed">LivvuxBot is the on-demand crawler for this website’s internal link audit. It runs only when someone submits a website and their own TypeSafe API key. It does not continuously index the web.</p>
    <pre className="overflow-x-auto rounded-md border p-4 text-xs">LivvuxBot/1.0 (+https://livvux.dev/tools/crawler)</pre>
    <h2 className="text-xl font-semibold">Crawl behaviour</h2>
    <p className="leading-relaxed">The crawler reads robots.txt before HTML pages or sitemaps. It honours matching Allow, Disallow and Crawl-delay rules. Requests start at least 200 ms apart per origin unless a longer Crawl-delay is set. At most four pages are fetched concurrently.</p>
    <p className="leading-relaxed">Only public HTTP(S) URLs on default ports are supported. Crawling stays on the entered hostname and its www alias. Redirect destinations are validated, including DNS and robots rules. Private networks, login credentials in URLs, non-HTML pages, and JavaScript rendering are not supported.</p>
    <h2 className="text-xl font-semibold">Block this crawler</h2>
    <pre className="overflow-x-auto rounded-md border p-4 text-sm">{"User-agent: LivvuxBot\nDisallow: /"}</pre>
    <p className="leading-relaxed">A 401 or 403 from robots.txt blocks the origin. Network errors and server errors stop crawling rather than bypassing rules. A missing robots.txt (404 or 410) is treated as having no rules.</p>
    <h2 className="text-xl font-semibold">Firewall troubleshooting</h2>
    <p className="leading-relaxed">Check your firewall logs for the user-agent above. There is no fixed IP allowlist published here. Do not disable your firewall or trust a user-agent alone: user-agent strings can be spoofed.</p>
  </main>;
}
