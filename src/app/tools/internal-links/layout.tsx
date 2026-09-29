import { DATA } from "@/data/resume";
import { StructuredData } from "@/components/structured-data";
import { absoluteUrl } from "@/lib/seo";

export default function InternalLinksLayout({ children }: { children: React.ReactNode }) {
  return <>
    <StructuredData data={{
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "@id": absoluteUrl("/tools/internal-links#application"),
      name: "Internal links tool",
      url: absoluteUrl("/tools/internal-links"),
      description: "An internal link checker with CSV and JSON reports. Free to use with your own TypeSafe API key; provider usage charges apply.",
      applicationCategory: "DeveloperApplication",
      operatingSystem: "Web",
      browserRequirements: "Requires JavaScript",
      author: { "@type": "Person", name: DATA.name, url: absoluteUrl("/") },
    }} />
    {children}
  </>;
}
