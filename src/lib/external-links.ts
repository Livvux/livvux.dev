// Match the canonical site URL without importing the icon-heavy resume data.
const SITE_ORIGIN = "https://livvux.dev";

export function isExternalHref(href?: string): boolean {
  if (!href) return false;

  try {
    const url = new URL(href, SITE_ORIGIN);
    return (
      (url.protocol === "http:" || url.protocol === "https:") &&
      url.origin !== SITE_ORIGIN
    );
  } catch {
    return false;
  }
}

export function getExternalLinkProps(
  href?: string,
  rel?: string,
): { target?: "_blank"; rel?: string } {
  if (!isExternalHref(href)) return {};

  const tokens = (rel ?? "")
    .toLowerCase()
    .split(/\s+/)
    .filter((token) => token && token !== "opener");

  return {
    target: "_blank",
    rel: [...new Set([...tokens, "noopener", "noreferrer"])].join(" "),
  };
}
