import Link from "next/link";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { LEGAL } from "@/lib/legal";
import { pageMetadata } from "@/lib/seo";

export const metadata = {
  ...pageMetadata({
    title: "Legal notice",
    description: "Legal operator information, contact and editorial responsibility for livvux.dev.",
    path: "/imprint/en",
  }),
  alternates: {
    canonical: "https://livvux.dev/imprint/en",
    languages: { de: "https://livvux.dev/imprint", en: "https://livvux.dev/imprint/en" },
  },
};

export default function ImprintEnglish() {
  return <main lang="en" className="prose max-w-full dark:prose-invert">
    <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Legal notice", href: "/imprint/en" }]} />
    <h1>Legal notice (Impressum)</h1>
    <p className="text-sm"><Link href="/imprint" hrefLang="de">Auf Deutsch lesen</Link></p>
    <h2>Operator information under Section 5 DDG (Germany)</h2>
    <address className="not-italic">
      {LEGAL.business}<br />
      {LEGAL.name}<br />
      {LEGAL.address[0]}<br />
      {LEGAL.address[1]}<br />
      Germany
    </address>
    <h2>Contact</h2>
    <p>Email: <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>. You may also <a href="https://lkmedia.net/kontakt" target="_blank" rel="noopener noreferrer">contact me through lkmedia</a>.</p>
    <h2>VAT identification number</h2>
    <p>Under Section 27a German VAT Act (UStG): {LEGAL.vatId}</p>
    <h2>Editorial responsibility</h2>
    <p>Responsible for editorial content under Section 18(2) German Interstate Media Treaty (MStV): {LEGAL.name}, {LEGAL.address.join(", ")}.</p>
    <p>This notice covers the personal website and blog at <strong>livvux.dev</strong>.</p>
    <p>Read the <Link href="/privacy">privacy notice</Link>.</p>
  </main>;
}
