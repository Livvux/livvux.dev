import { DATA } from "@/data/resume";
import { pageMetadata } from "@/lib/seo";
import { UMAMI_WEBSITE_ID, validUmamiWebsiteId } from "@/lib/umami";

export const metadata = pageMetadata({ title: "Privacy", description: "Privacy and public page statistics on livvux.dev.", path: "/privacy" });

export default function PrivacyPage() {
  const active = validUmamiWebsiteId(UMAMI_WEBSITE_ID);
  return <main className="prose dark:prose-invert">
    <h1>Privacy</h1>
    <p>This personal portfolio is operated by {DATA.name} (Livvux). For privacy questions, contact <a href="mailto:lucas@lkmedia.net">lucas@lkmedia.net</a>.</p>
    <h2>Technical requests</h2>
    <p>Serving this website involves technical request information such as your IP address, browser headers and the requested resource. Theme preferences are used to display the website; they are not page statistics.</p>
    <h2>Public page statistics</h2>
    <p>{active ? "I use self-hosted Umami to count visits to the public portfolio and published blog pages." : "Additional Umami page statistics are currently disabled."}</p>
    <p>When enabled, the script and measurement requests use my self-hosted collector at rpcrate.com. These requests technically involve your IP address and browser headers, including the User-Agent. The pageview payload contains the public page path and title; it omits query strings, fragments, referrer contents, search text and form values. Tool, API, private and unknown pages are excluded. No analytics cookies, custom visitor identifiers, session recordings or marketing events are added.</p>
    <p>Do Not Track and Global Privacy Control prevent this additional measurement. The purpose is basic reach statistics for these public pages.</p>
  </main>;
}
