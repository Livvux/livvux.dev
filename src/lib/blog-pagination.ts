export const BLOG_PAGE_SIZE = 5;

export function blogPageHref(page: number): string {
  return page === 1 ? "/blog" : `/blog?page=${page}`;
}

/** Reject malformed/out-of-range pages instead of serving duplicate last pages. */
export function parseBlogPage(value: string | string[] | undefined, totalPages: number): number | null {
  if (value === undefined) return 1;
  if (typeof value !== "string" || !/^\d+$/.test(value)) return null;
  const page = Number(value);
  return Number.isSafeInteger(page) && page >= 1 && page <= Math.max(1, totalPages) ? page : null;
}
