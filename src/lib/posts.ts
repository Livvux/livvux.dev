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
  return allPosts.find((p) => p._meta.path === `${postId(post)}/${other}`);
}

export function hrefFor(post: Post): string {
  return postLang(post) === "de" ? `/blog/${postId(post)}/de` : `/blog/${postId(post)}`;
}

// The archive remains EN-preferred; article navigation requests its exact language.
export function getPosts(lang?: PostLang): Post[] {
  const byId = new Map<string, Post>();
  for (const post of allPosts) {
    if (lang && postLang(post) !== lang) continue;
    const existing = byId.get(postId(post));
    if (!existing || (postLang(existing) === "de" && postLang(post) === "en")) {
      byId.set(postId(post), post);
    }
  }
  return [...byId.values()].sort((a, b) =>
    (Date.parse(b.publishedAt) - Date.parse(a.publishedAt)) || postId(a).localeCompare(postId(b))
  );
}

const stopWords = new Set("about after also and are aus bei das dem den der des die ein eine einem einen einer for from how ich ist mit nicht oder that the their this und von was weil what why wie wir with you your".split(" "));

function topicWords(post: Post): Set<string> {
  return new Set((`${post.title} ${post.summary}`.toLowerCase().match(/[\p{L}\p{N}-]{3,}/gu) ?? []).filter((word) => !stopWords.has(word)));
}

/** Prefer overlapping topics, then recent posts, without crossing languages. */
export function getRelatedPosts(post: Post, limit = 3): Post[] {
  const words = topicWords(post);
  return getPosts(postLang(post))
    .filter((candidate) => postId(candidate) !== postId(post))
    .map((candidate) => ({
      post: candidate,
      score: [...topicWords(candidate)].filter((word) => words.has(word)).length,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.max(0, limit))
    .map((candidate) => candidate.post);
}
