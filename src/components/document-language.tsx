"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/** Preserve the legacy blog URLs while synchronizing browser document language. */
export function DocumentLanguage() {
  const pathname = usePathname();
  useEffect(() => {
    const german = pathname === "/imprint" || pathname === "/privacy/de" ||
      pathname === "/blog/de" || /^\/blog\/[^/]+\/de$/.test(pathname);
    document.documentElement.lang = german ? "de" : "en";
  }, [pathname]);
  return null;
}
