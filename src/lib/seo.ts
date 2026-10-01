import type { Metadata } from "next";
import { DATA } from "@/data/resume";
import { hrefFor, postLang, translationOf, type Post } from "@/lib/posts";

export function absoluteUrl(path: string): string {
  return new URL(path, DATA.url).href;
}

export function postUrl(post: Post): string {
  // Match the sitemap's encoding of literal content path segments.
  return absoluteUrl(hrefFor(post).split("/").map(encodeURIComponent).join("/"));
}

export function imageUrl(image: string | undefined, fallback: string): string {
  try {
    const url = new URL(image?.trim() || fallback, DATA.url);
    if (url.protocol === "https:" || url.protocol === "http:") return url.href;
  } catch {
    // Malformed editorial image URLs should not break metadata generation.
  }
  return absoluteUrl(fallback);
}

export function serializeJsonLd(data: unknown): string {
  // Do not allow editorial text to close a script element.
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function pageMetadata({
  title,
  description,
  path,
  image = "/opengraph-image",
}: {
  title: string;
  description: string;
  path: string;
  image?: string;
}): Metadata {
  const url = absoluteUrl(path);
  const socialImage = { url: imageUrl(image, "/opengraph-image"), width: 1200, height: 630, alt: title };
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, siteName: DATA.name, type: "website", locale: "en_US", images: [socialImage] },
    twitter: { card: "summary_large_image", title, description, images: [socialImage] },
  };
}

export function editorialDate(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const dayPattern = /^\d{4}-\d{2}-\d{2}$/;
  const timestampPattern = /^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d+)?)?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/;
  if (!dayPattern.test(value) && !timestampPattern.test(value)) return undefined;
  const day = value.slice(0, 10);
  const parsedDay = new Date(`${day}T00:00:00Z`);
  if (!Number.isFinite(Date.parse(value)) || !Number.isFinite(parsedDay.getTime())) return undefined;
  return parsedDay.toISOString().slice(0, 10) === day ? value : undefined;
}

export function postDates(post: Post) {
  return {
    published: editorialDate(post.publishedAt),
    // Match sitemap lastmod: an invalid explicit update is omitted, not replaced
    // with a build timestamp or a claimed older publication date.
    modified: editorialDate(post.updatedAt ?? post.publishedAt),
  };
}

export function postImage(post: Post): string {
  return imageUrl(post.image, new URL(postUrl(post)).pathname.replace("/blog/", "/blog/og/"));
}

export function postAuthor(post: Post) {
  const name = post.author?.trim() || DATA.name;
  return { name, ...(name === DATA.name ? { url: absoluteUrl("/") } : {}) };
}

export function postMetadata(post: Post): Metadata {
  const url = postUrl(post);
  const lang = postLang(post);
  const translation = translationOf(post);
  const dates = postDates(post);
  const image = { url: postImage(post), alt: post.title, ...(!post.image ? { width: 1200, height: 630 } : {}) };
  const languages = translation ? {
    [lang]: url,
    [postLang(translation)]: postUrl(translation),
    "x-default": lang === "en" ? url : postUrl(translation),
  } : undefined;
  const author = postAuthor(post);
  return {
    title: post.title,
    description: post.summary,
    authors: [author],
    alternates: { canonical: url, ...(languages ? { languages } : {}) },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.summary,
      url,
      siteName: DATA.name,
      locale: lang === "de" ? "de_DE" : "en_US",
      ...(translation ? { alternateLocale: [lang === "de" ? "en_US" : "de_DE"] } : {}),
      publishedTime: dates.published,
      modifiedTime: dates.modified,
      authors: [author.url ?? author.name],
      images: [image],
    },
    twitter: { card: "summary_large_image", title: post.title, description: post.summary, images: [image] },
  };
}

export function postStructuredData(post: Post) {
  const url = postUrl(post);
  const dates = postDates(post);
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${url}#article`,
    headline: post.title,
    description: post.summary,
    url,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    isPartOf: { "@id": absoluteUrl("/#website") },
    inLanguage: postLang(post),
    datePublished: dates.published,
    dateModified: dates.modified,
    image: [postImage(post)],
    author: { "@type": "Person", ...postAuthor(post) },
    publisher: { "@type": "Person", "@id": absoluteUrl("/#person"), name: DATA.name, url: absoluteUrl("/") },
  };
}

export function siteStructuredData() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": absoluteUrl("/#website"),
        url: absoluteUrl("/"),
        name: "livvux.dev",
        alternateName: DATA.name,
        description: DATA.description,
        inLanguage: ["en", "de"],
        publisher: { "@id": absoluteUrl("/#person") },
      },
      {
        "@type": "Person",
        "@id": absoluteUrl("/#person"),
        name: DATA.name,
        alternateName: "Livvux",
        url: absoluteUrl("/"),
        image: absoluteUrl(DATA.avatarUrl),
        sameAs: Object.values(DATA.contact.social).map((profile) => profile.url).filter((url) => url.startsWith("https://")),
      },
    ],
  };
}

export type BreadcrumbItem = { name: string; href: string };

export function breadcrumbStructuredData(items: readonly BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.href),
    })),
  };
}
