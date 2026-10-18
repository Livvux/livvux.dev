"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function LegalFooter() {
  const pathname = usePathname();
  const german = pathname === "/imprint" || pathname === "/privacy/de" ||
    pathname === "/blog/de" || /^\/blog\/[^/]+\/de$/.test(pathname);
  return <footer className="mt-12 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground" aria-label={german ? "Rechtliche Informationen" : "Legal information"}>
    <Link href={german ? "/imprint" : "/imprint/en"} className="underline underline-offset-4">{german ? "Impressum" : "Legal notice"}</Link>
    <Link href={german ? "/privacy/de" : "/privacy"} className="underline underline-offset-4">{german ? "Datenschutz" : "Privacy"}</Link>
    <a href="https://lkmedia.net" target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">lkmedia</a>
  </footer>;
}
