import Link from "next/link";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { LEGAL } from "@/lib/legal";
import { pageMetadata } from "@/lib/seo";

export const metadata = {
  ...pageMetadata({
    title: "Impressum",
    description: "Anbieterkennzeichnung, Kontakt und redaktionelle Verantwortung für livvux.dev.",
    path: "/imprint",
  }),
  alternates: {
    canonical: "https://livvux.dev/imprint",
    languages: { de: "https://livvux.dev/imprint", en: "https://livvux.dev/imprint/en" },
  },
};

export default function Imprint() {
  return <main lang="de" className="prose max-w-full dark:prose-invert">
    <Breadcrumbs label="Brotkrumennavigation" items={[{ name: "Startseite", href: "/" }, { name: "Impressum", href: "/imprint" }]} />
    <h1>Impressum</h1>
    <p className="text-sm"><Link href="/imprint/en" hrefLang="en">Read in English</Link></p>
    <h2>Angaben gemäß § 5 DDG</h2>
    <address className="not-italic">
      {LEGAL.business}<br />
      {LEGAL.name}<br />
      {LEGAL.address[0]}<br />
      {LEGAL.address[1]}<br />
      {LEGAL.address[2]}
    </address>
    <h2>Kontakt</h2>
    <p>E-Mail: <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>. Alternativ ist eine <a href="https://lkmedia.net/kontakt" target="_blank" rel="noopener noreferrer">Kontaktanfrage über lkmedia</a> möglich.</p>
    <h2>Umsatzsteuer-Identifikationsnummer</h2>
    <p>Gemäß § 27a UStG: {LEGAL.vatId}</p>
    <h2>Redaktionell verantwortlich</h2>
    <p>Verantwortlich für die journalistisch-redaktionellen Inhalte nach § 18 Abs. 2 MStV: {LEGAL.name}, {LEGAL.address.join(", ")}.</p>
    <p>Dieses Impressum gilt für die persönliche Website und den Blog <strong>livvux.dev</strong>.</p>
    <p>Siehe auch die <Link href="/privacy/de">Datenschutzerklärung</Link>.</p>
  </main>;
}
