"use client";

import { createContext, useContext, useEffect, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { UMAMI_WEBSITE_ID, observeUmamiNavigation, publicUmamiPath, startUmamiPage } from "@/lib/umami";

const Enabled = createContext(false);

export function UmamiProvider({ enabled, children }: { enabled: boolean; children: ReactNode }) {
  const pathname = usePathname();
  useEffect(() => { observeUmamiNavigation(pathname); }, [pathname]);
  return <Enabled.Provider value={enabled}>{children}</Enabled.Provider>;
}

export function UmamiPageview({ path, title, ownerKey = path }: { path: string; title: string; ownerKey?: string }) {
  const enabled = useContext(Enabled);
  const pathname = usePathname();
  useEffect(() => {
    if (!enabled || publicUmamiPath(pathname) !== publicUmamiPath(path)) return;
    return startUmamiPage(UMAMI_WEBSITE_ID, path, title, ownerKey);
  }, [enabled, pathname, path, title, ownerKey]);
  return null;
}
