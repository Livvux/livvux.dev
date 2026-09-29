import { Breadcrumbs } from "@/components/breadcrumbs";
import { pageMetadata } from "@/lib/seo";
import InternalLinks from "@/components/tools/internal-links";
import styles from "@/components/tools/internal-links.module.css";

export const metadata = pageMetadata({
  title: "Free Internal Link Checker and Audit Tool for SEO",
  description: "Crawl your website, find weak pages, and get contextual internal link suggestions with real anchors and placements. Bring your own TypeSafe API key.",
  path: "/tools/internal-links",
});

export default function InternalLinksPage() {
  return <main className={styles.page}>
    <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Tools", href: "/tools" }, { name: "Internal links tool", href: "/tools/internal-links" }]} />
    <header className={styles.intro}>
      <h1>Internal links tool</h1>
      <p className={styles.subtitle}>Crawl your site, find weak pages, and get contextual link suggestions with anchors and placement.</p>
      <p>Enter your site URL in the form below and the internal linking tool will read robots.txt and your sitemap, fetch up to 500 pages, and map existing internal links. It then uses <a href="https://typesafe.ai/" target="_blank" rel="noopener noreferrer">Jev</a> to classify each page and its search intent to recommend an internal linking structure.</p>
      <p>It’s free to use with your own TypeSafe API key. There is no paid report option; TypeSafe API usage is billed separately by TypeSafe.</p>
    </header>
    <InternalLinks />
    <article className={styles.prose} aria-label="How the internal link audit works">
<h2 id="what-you-get">What you get</h2>
<ul>
<li>A link map of every page that has little or no contextual links to it, and the recommended pages that should link to it.</li>
<li>Ranked links by how confident Jev is, including the source, target, the sentence to put the link in, the anchor text phrase and the job the link does for a reader.</li>
<li>A table of pages with each page’s type, search intent, word count, links in (contextual and total), and suggested links.</li>
<li>Existing links with generic anchors such as “click here” or “read more” that you should rewrite.</li>
<li>CSV and JSON download options for the whole report.</li>
</ul>
<h2 id="how-the-crawl-works">How the crawl works</h2>
<ul>
<li>The site is crawled by <a href="/tools/crawler">LivvuxBot</a>. It reads and honours <code>robots.txt</code> disallow rules. If your firewall blocks LivvuxBot you can use the <a href="/tools/crawler">LivvuxBot page</a> to allow it.</li>
<li>It finds your sitemap from <code>robots.txt</code> or at the usual sitemap paths. For sites with no sitemap it will follow links from the home page.</li>
<li>Fetches up to 500 HTML pages, honours <code>Crawl-delay</code>, and drops duplicate pages with a canonical URL pointing at another fetched page.</li>
<li>Existing internal links in the fetched HTML are recorded with its anchor text and whether it’s in the body or in navigation.</li>
</ul>
<h2 id="how-the-analysis-works">How the analysis works</h2>
<ul>
<li>Each page’s body text is first split into sentences and headings.</li>
<li>Every page is then scored with TF-IDF. Term frequency (TF) is how often a word appears on a page and inverse document frequency (IDF) is how rare that word is across the whole site. This gives higher scores to the words that define the page and lower scores to words that appear more commonly (like your brand name).</li>
<li>For each source page the eight most similar pages become candidate targets. Pages with fewer than three links in get a score boost to find and get links to orphan pages (pages with no internal links).</li>
<li>Link placements are found by locating the four sentences in the source page most related to the target page. The phrases in those sentences that match the target’s keywords become the anchor text options.</li>
<li>Jev only chooses between the sentences and anchor text options the code found. Every suggestion points at a real sentence and a real phrase on your page.</li>
</ul>
<h2 id="what-jev-decides">What Jev decides</h2>
<p>Jev classifies every page as one of these types:</p>
<ul>
<li><code>pillar_guide</code>. Long, broad articles that should link out to many narrower pages.</li>
<li><code>support_article</code>. A focused article or post like a tutorial or explainer.</li>
<li><code>product_or_service</code>. A page whose primary focus is commercial (either selling or describing a product/service).</li>
<li><code>comparison_or_review</code>. A competitor “vs” page, a product review, or a best-of list.</li>
<li><code>glossary_or_definition</code>. Shorter page that defines one term or definition.</li>
<li><code>tool_or_calculator</code>. An interactive page like a calculator or tool (like this internal link tool!).</li>
<li><code>news_or_update</code>. A dated announcement or changelog entry. (These rank lower as targets because they go stale)</li>
<li><code>category_hub</code>. An archive page, listing, tag, category or index page.</li>
<li><code>home</code>, <code>about_or_company</code>, <code>legal_or_utility</code> or <code>other</code>.</li>
</ul>
<p>Jev also decides the search intent of every page: <code>informational</code>, <code>commercial</code>, <code>transactional</code> or <code>navigational</code>.</p>
<p>For every candidate link it answers four questions:</p>
<ol>
<li>Should the source link to the target at all?</li>
<li>Which sentence does the link belong in?</li>
<li>Which phrase in that sentence should be the anchor?</li>
<li>What does the link do for the reader?</li>
</ol>
<p>The answer to the last question is the link’s role:</p>
<ul>
<li><code>explains_concept</code>. The target explains a term or idea the source mentions.</li>
<li><code>deeper_detail</code>. The target goes deeper into a sub-topic the source only touches on.</li>
<li><code>broader_guide</code>. The target is the broader guide or hub the source belongs under.</li>
<li><code>next_step</code>. The target is what a reader should read or do next.</li>
<li><code>product_or_service</code>. The target is the product or service that solves the problem discussed.</li>
<li><code>comparison_or_alternative</code>. The target compares or offers an alternative to what the source discusses.</li>
</ul>
<p>Home pages, legal pages and hubs are never suggested as sources or targets. About pages are never suggested as targets.</p>
      <h2 id="pricing-and-privacy">Pricing and privacy</h2>
      <ul>
        <li>Using your own TypeSafe API key, this tool is free. TypeSafe charges your account for its API usage; the displayed cost is an estimate.</li>
        <li>The application does not write your key, fetched pages, or reports to a database, cookies, or browser storage. They are held in memory during the run. The report stays in this browser tab until you leave or reload.</li>
        <li>Your key is sent to this server and used only with TypeSafe. Extracted page text is sent to TypeSafe for analysis. TypeSafe’s own data handling terms apply; this is not a promise of zero retention by that provider.</li>
        <li>Only crawl sites you are authorised to audit. Cancelling stops further work, but TypeSafe may still charge for requests already processed.</li>
      </ul>
      <h2 id="limits">Crawl limits and review</h2>
      <p>This tool reads server-delivered HTML, not JavaScript-rendered content. Counts cover the fetched sample. No contextual links found does not necessarily mean a page is an orphan across the entire site.</p>
      <p>Runs are limited to 500 page attempts, 32 sitemap files, 100 MB of downloaded content, and 270 seconds. Very large or slow sites, or sites with a long Crawl-delay, may not finish. A timed-out run is shown as incomplete rather than a successful report.</p>
      <p>Text extraction is limited to 40,000 characters and 500 candidate sentences per page. Noindex pages are not recommended, existing links are not suggested again, and pages with different declared languages are not paired. Review every suggestion before publishing it.</p>
      <p>This is an independent implementation of the workflow described in <a href="https://ian.is/tools/internal-links" target="_blank" rel="noopener noreferrer">Ian Nuttall’s internal links tool</a>. It does not use Ian’s crawler or backend. The documented steps are reproduced; private prompts and exact ranking results are not available. <a href="https://docs.typesafe.ai/models" target="_blank" rel="noopener noreferrer">TypeSafe model and pricing documentation</a>.</p>
    </article>
  </main>;
}
