// Remains disabled until the existing account supplies this portfolio's own ID.
export const UMAMI_WEBSITE_ID = "";
export const UMAMI_SCRIPT_URL = "https://rpcrate.com/_sr/s.js";
const HOSTS = new Set(["livvux.dev", "www.livvux.dev"]);
const PRIVATE_PATH = /\/(?:api|admin|auth|account|login|checkout|reset|password|token|session|tools|opengraph-image|twitter-image)(?:\/|$)/i;
const PRIVATE_PARAMETER = /^(?:session(?:_?id)?|token|access_?token|refresh_?token|id_?token|code|state|key|email|order(?:_?id)?|customer(?:_?id)?|password|reset|auth|next)$/i;

export function validUmamiWebsiteId(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

/** Only page owners may supply this path; blog owners resolve real content first. */
export function publicUmamiPath(value: string): string | null {
  if (!value.startsWith("/") || value.startsWith("//") || /[?#\\\s]/.test(value)) return null;
  try {
    const decoded = decodeURIComponent(value);
    if (PRIVATE_PATH.test(decoded) || /[?#\\\s]/.test(decoded)) return null;
  } catch { return null; }
  const path = value.replace(/\/+$/, "") || "/";
  return path === "/" || path === "/blog" || /^\/blog\/[a-z0-9][a-z0-9-]*(?:\/de)?$/.test(path) ? path : null;
}

interface PrivacySignals {
  doNotTrack?: string | null;
  msDoNotTrack?: string | null;
  globalPrivacyControl?: boolean;
}

export function umamiPageAllowed(id: string, expectedPath: string, url: URL, privacy: PrivacySignals, legacyDnt?: string | number | null): boolean {
  const path = publicUmamiPath(expectedPath);
  return validUmamiWebsiteId(id) && url.protocol === "https:" && url.port === "" &&
    url.username === "" && url.password === "" && HOSTS.has(url.hostname.toLowerCase()) &&
    path !== null && publicUmamiPath(url.pathname) === path &&
    ![...url.searchParams.keys(), ...new URLSearchParams(url.hash.slice(1)).keys()].some((key) => PRIVATE_PARAMETER.test(key)) &&
    ![privacy.doNotTrack, privacy.msDoNotTrack, legacyDnt].some((value) => value === 1 || value === "1" || value === "yes") &&
    privacy.globalPrivacyControl !== true;
}

interface Payload { website: string; hostname: string; url: string; title: string; referrer: string; }
declare global { interface Window { umami?: { track: (payload: Payload) => Promise<unknown> }; } }
let navigationPath: string | null = null;
let lastSentOwner: string | null = null;
let activeOwner: symbol | null = null;
let loader: Promise<void> | null = null;

/** Observes committed route changes, including unmeasured pages; sends no request. */
export function observeUmamiNavigation(pathname: string): void {
  if (pathname !== navigationPath) {
    navigationPath = pathname;
    lastSentOwner = null;
  }
}

function loadTracker(id: string): Promise<void> {
  if (loader) return loader;
  loader = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.id = "livvux-dev-umami-script";
    script.src = UMAMI_SCRIPT_URL;
    script.defer = true;
    script.referrerPolicy = "no-referrer";
    Object.assign(script.dataset, { websiteId: id, autoTrack: "false", doNotTrack: "true",
      excludeSearch: "true", excludeHash: "true", fetchCredentials: "omit", domains: [...HOSTS].join(",") });
    script.addEventListener("load", () => resolve(), { once: true });
    script.addEventListener("error", () => reject(new Error("Tracker unavailable")), { once: true });
    document.head.append(script);
  });
  return loader;
}

/** One public rendered-page owner; cleanup cancels requests from departed routes. */
export function startUmamiPage(id: string, path: string, title: string, ownerKey = path): (() => void) | undefined {
  const allowed = () => umamiPageAllowed(id, path, new URL(window.location.href),
    navigator as Navigator & PrivacySignals, (window as Window & { doNotTrack?: string | number }).doNotTrack);
  if (!allowed()) return;
  observeUmamiNavigation(window.location.pathname);
  const owner = Symbol();
  activeOwner = owner;
  const send = () => {
    if (activeOwner !== owner || lastSentOwner === ownerKey || document.visibilityState !== "visible" || !allowed() || !window.umami) return;
    lastSentOwner = ownerKey;
    document.removeEventListener("visibilitychange", send);
    void window.umami.track({ website: id, hostname: window.location.hostname,
      url: publicUmamiPath(path) ?? "/", title, referrer: "" }).catch(() => {});
  };
  void loadTracker(id).then(() => {
    if (activeOwner !== owner) return;
    document.addEventListener("visibilitychange", send);
    send();
  }).catch(() => {});
  return () => {
    if (activeOwner === owner) activeOwner = null;
    document.removeEventListener("visibilitychange", send);
  };
}
