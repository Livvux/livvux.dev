import { allPosts } from "content-collections";

export type Post = (typeof allPosts)[number];
export type PostLang = "en" | "de";

export function postLang(post: Post): PostLang {
  return post._meta.path.endsWith("/de") ? "de" : "en";
}

export function postId(post: Post): string {
  return post._meta.path.replace(/\/(en|de)$/, "");
}

export function findPost(slug: string[]): Post | undefined {
  if (slug.length === 1) {
    return allPosts.find((p) => p._meta.path === `${slug[0]}/en`);
  }
  if (slug.length === 2 && slug[1] === "de") {
    return allPosts.find((p) => p._meta.path === `${slug[0]}/de`);
  }
  return undefined;
}

export function translationOf(post: Post): Post | undefined {
  const other = postLang(post) === "de" ? "en" : "de";
  return allPosts.find(
    (p) => p._meta.path === `${postId(post)}/${other}`
  );
}

export function hrefFor(post: Post): string {
  return postLang(post) === "de"
    ? `/blog/${postId(post)}/de`
    : `/blog/${postId(post)}`;
}

// ponytail: EN preferred per post; switch to explicit sort field if that ever matters
export function getPosts(): Post[] {
  const byId = new Map<string, Post>();
  for (const post of allPosts) {
    const existing = byId.get(postId(post));
    if (!existing || (postLang(existing) === "de" && postLang(post) === "en")) {
      byId.set(postId(post), post);
    }
  }
  return [...byId.values()].sort((a, b) =>
    new Date(a.publishedAt) > new Date(b.publishedAt) ? -1 : 1
  );
}
