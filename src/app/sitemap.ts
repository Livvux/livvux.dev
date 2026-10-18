import type { MetadataRoute } from "next";
import { allPosts } from "content-collections";
import { DATA } from "@/data/resume";
import { findPost, hrefFor, postId, postLang, type Post } from "@/lib/posts";

// Only indexable HTML pages belong here. Posts are discovered below; API routes,
// redirects, OG images, assets, and query-string variants are intentionally absent.
const staticPaths = [
  "/",
  "/blog",
  "/blog/de",
  "/tools",
  "/tools/internal-links",
  "/tools/crawler",
  "/imprint",
  "/imprint/en",
  "/privacy",
  "/privacy/de",
] as const;

function absoluteUrl(path: string): string {
  // Encode individual path segments, not the slashes. This also keeps characters
  // such as & out of XML values without double-escaping the generated XML.
  const encodedPath = path.split("/").map(encodeURIComponent).join("/");
  return new URL(encodedPath, DATA.url).href;
}

function lastModifiedFor(post: Post): string | undefined {
  // Use editorial dates, never a build time or filesystem mtime. When an explicit
  // update date is invalid, omit lastmod rather than claiming an older date.
  const value = post.updatedAt ?? post.publishedAt;
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;
  const timestampPattern = /^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d+)?)?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/;
  if (!datePattern.test(value) && !timestampPattern.test(value)) return undefined;

  const day = value.slice(0, 10);
  const parsedDay = new Date(`${day}T00:00:00Z`);
  if (
    !Number.isFinite(Date.parse(value)) ||
    !Number.isFinite(parsedDay.getTime()) ||
    parsedDay.toISOString().slice(0, 10) !== day
  ) return undefined;

  return value;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const entries = new Map<string, MetadataRoute.Sitemap[number]>();
  for (const path of staticPaths) {
    const url = absoluteUrl(path);
    // Static pages have no reliable editorial update date; lastmod is optional.
    entries.set(url, { url });
  }

  // Match the page resolver, including its EN/DE URL convention. Do not advertise
  // malformed content paths or duplicate documents that the router cannot serve.
  const posts = allPosts.filter((post) => {
    const slug = hrefFor(post).slice("/blog/".length).split("/");
    return findPost(slug) === post;
  });
  const languagesById = new Map<string, Record<string, string>>();
  for (const post of posts) {
    const id = postId(post);
    const languages = languagesById.get(id) ?? {};
    languages[postLang(post)] = absoluteUrl(hrefFor(post));
    languagesById.set(id, languages);
  }

  for (const post of posts) {
    const url = absoluteUrl(hrefFor(post));
    const lastModified = lastModifiedFor(post);
    const languages = languagesById.get(postId(post))!;
    entries.set(url, {
      url,
      ...(lastModified ? { lastModified } : {}),
      // Both translations list themselves and each other. Single-language posts
      // must not advertise a translation URL that does not exist.
      ...(Object.keys(languages).length > 1 ? { alternates: { languages } } : {}),
    });
  }

  // Stable output makes diffs and crawl diagnostics easier to inspect.
  return [...entries.values()].sort((a, b) => a.url.localeCompare(b.url));
}
