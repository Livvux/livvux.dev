import Link from "next/link";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { LEGAL } from "@/lib/legal";
import { pageMetadata } from "@/lib/seo";
import { UMAMI_WEBSITE_ID, validUmamiWebsiteId } from "@/lib/umami";

export const metadata = {
  ...pageMetadata({
    title: "Privacy notice",
    description: "How livvux.dev handles technical access data, self-hosted analytics, external media and contact requests.",
    path: "/privacy",
  }),
  alternates: { canonical: "https://livvux.dev/privacy", languages: { en: "https://livvux.dev/privacy", de: "https://livvux.dev/privacy/de" } },
};

export default function PrivacyPage() {
  const analytics = validUmamiWebsiteId(UMAMI_WEBSITE_ID);
  return <main lang="en" className="prose max-w-full dark:prose-invert">
    <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Privacy", href: "/privacy" }]} />
    <h1>Privacy notice</h1>
    <p className="text-sm"><Link href="/privacy/de" hrefLang="de">Auf Deutsch lesen</Link></p>
    <p>Last reviewed: 18 October 2026. This notice applies to <strong>livvux.dev</strong>, not to the separate services or products linked from this website.</p>
    <h2>1. Controller</h2>
    <p>{LEGAL.business}, {LEGAL.name}, {LEGAL.address.join(", ")}. Contact: <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>. Full details: <Link href="/imprint/en">legal notice</Link>.</p>
    <h2>2. Hosting and access logs</h2>
    <p>Serving this site requires the web server and any hosting or proxy infrastructure to process an IP address, request time, requested resource and technical browser or network headers. Processing is necessary for availability, troubleshooting and protection from abuse (Article 6(1)(f) GDPR, legitimate interests). Operational logs are retained only as long as needed for those purposes, subject to the hosting and proxy configurations and any applicable legal obligations. Request the applicable retention details using the contact above.</p>
    <h2>3. Site preferences</h2>
    <p>The light/dark theme preference can be stored locally in your browser so it persists between visits. It is not used for advertising or analytics profiling. No marketing cookies are set by this website.</p>
    <h2>4. Self-hosted visitor statistics</h2>
    <p>{analytics ? "Umami is enabled for public portfolio and blog pages." : "Umami visitor statistics are disabled at present."} When enabled, its script and event collection run through the self-hosted endpoint on <strong>rpcrate.com</strong>. Network requests technically expose your IP address and browser headers to the server. Pageview events include a public page path and title, but not URL queries, fragments, referrer text, form values or custom visitor identifiers. The implementation does not set analytics cookies; tool and API pages are not tracked. Do Not Track and Global Privacy Control signals disable this measurement. The purpose and legal basis are aggregate reach statistics (Article 6(1)(f) GDPR).</p>
    <h2>5. External content and links</h2>
    <p>Embedded posts from X are only loaded when you select the dedicated load button. Doing so contacts X and its infrastructure and may transfer technical request data to providers outside the EU. Some article images may be fetched from their external hosts when a page loads; those requests also disclose technical connection data to those hosts. External links take you to independent third-party websites with their own privacy policies. Links to third-party sites do not automatically transmit the content of a private form.</p>
    <h2>6. Internal link audit tool</h2>
    <p>When you voluntarily use the <Link href="/tools/internal-links">internal link checker</Link>, your supplied TypeSafe API key and the entered website address are processed in server memory during the audit. The crawler fetches public pages from the requested website, and selected extracted page text is transmitted to TypeSafe for analysis. The application does not intentionally write the key, audit report or crawled contents to a database or browser storage. TypeSafe processes data under its own terms and may have separate retention rules. Please audit only websites you are authorized to crawl.</p>
    <h2>7. Contact</h2>
    <p>When you email the address above or follow a link to the separate lkmedia contact form, the information you provide is used to handle the inquiry. The legal basis is Article 6(1)(b) GDPR for contractual or pre-contractual requests, or Article 6(1)(f) GDPR for other correspondence. Email and inquiry data is retained as needed to respond and meet applicable record-keeping duties; the third-party service has a separate notice.</p>
    <h2>8. Recipients, international transfers and storage</h2>
    <p>Technical service providers may process connection data as part of hosting and delivery. The self-hosted collector and TypeSafe are described above. External media providers can receive technical request data when their content is accessed. Depending on the provider, transfers outside the European Economic Area may occur; applicable safeguards must be assessed with the provider. Personal data is not kept longer than necessary for its purpose or mandatory statutory retention periods.</p>
    <h2>9. Your rights</h2>
    <p>Subject to legal conditions, you can request access, rectification, erasure, restriction, portability, or object to processing based on legitimate interests (Articles 15–21 GDPR). You may withdraw any consent you have given without affecting prior lawful processing. Contact <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>. You may complain to a competent data protection supervisory authority.</p>
    <p><em>Information about processing is based on the repository configuration; actual deployment/provider logging and retention settings should be checked against the live infrastructure.</em></p>
  </main>;
}
