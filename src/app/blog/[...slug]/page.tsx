import { allPosts } from "content-collections";
import { formatDate } from "@/lib/utils";
import { DATA } from "@/data/resume";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MDXContent } from "@content-collections/mdx/react";
import { mdxComponents } from "@/mdx-components";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  findPost,
  getPosts,
  hrefFor,
  postId,
  postLang,
  translationOf,
  type PostLang,
} from "@/lib/posts";

function formatPostDate(date: string, lang: PostLang) {
  return formatDate(new Date(date), lang === "de" ? "de-DE" : "en-US");
}

export async function generateStaticParams() {
  return allPosts.map((post) => {
    const id = postId(post);
    return { slug: postLang(post) === "de" ? [id, "de"] : [id] };
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{
    slug: string[];
  }>;
}): Promise<Metadata | undefined> {
  const { slug } = await params;
  const post = findPost(slug);

  if (!post) {
    return undefined;
  }

  const id = postId(post);
  const lang = postLang(post);
  const canonicalHref =
    lang === "de" ? `/blog/${id}/de` : `/blog/${id}`;
  const { title, publishedAt: publishedTime, summary: description, image } = post;
  const translation = translationOf(post);
  const ogImage = `${DATA.url}/blog/og${lang === "de" ? `/${id}/de` : `/${id}`}`;

  return {
    title,
    description,
    alternates: {
      canonical: `${DATA.url}${canonicalHref}`,
      ...(translation && {
        languages: {
          en: `${DATA.url}/blog/${id}`,
          de: `${DATA.url}/blog/${id}/de`,
        },
      }),
    },
    openGraph: {
      title,
      description,
      type: "article",
      publishedTime,
      url: `${DATA.url}${canonicalHref}`,
      images: image ? [{ url: `${DATA.url}${image}` }] : [{ url: ogImage, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image ? `${DATA.url}${image}` : ogImage],
    },
  };
}

export default async function Blog({
  params,
}: {
  params: Promise<{
    slug: string[];
  }>;
}) {
  const { slug } = await params;
  const post = findPost(slug);

  if (!post) {
    notFound();
  }

  const id = postId(post);
  const lang = postLang(post);
  const translation = translationOf(post);
  const sortedPosts = getPosts();
  const currentIndex = sortedPosts.findIndex((p) => postId(p) === id);
  const previousPost = currentIndex > 0 ? sortedPosts[currentIndex - 1] : null;
  const nextPost =
    currentIndex < sortedPosts.length - 1 ? sortedPosts[currentIndex + 1] : null;

  const canonicalHref = hrefFor(post);

  const jsonLdContent = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    datePublished: post.publishedAt,
    dateModified: post.publishedAt,
    description: post.summary,
    inLanguage: lang,
    image: post.image ? `${DATA.url}${post.image}` : `${DATA.url}/blog/og${lang === "de" ? `/${id}/de` : `/${id}`}`,
    url: `${DATA.url}${canonicalHref}`,
    author: {
      "@type": "Person",
      name: DATA.name,
    },
  }).replace(/</g, "\\u003c");

  return (
    <section id="blog">
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: jsonLdContent,
        }}
      />
      <div className="flex justify-start gap-4 items-center">
        <Link href="/blog" className="text-sm text-muted-foreground hover:text-foreground transition-colors border border-border rounded-lg px-2 py-1 inline-flex items-center gap-1 mb-6 group" aria-label="Back to Blog">
          <ChevronLeft className="size-3 group-hover:-translate-x-px transition-transform" />
          Back to Blog
        </Link>
      </div>
      <div className="flex flex-col gap-4">
        <h1 className="title font-semibold text-3xl md:text-4xl tracking-tighter leading-tight">
          {post.title}
        </h1>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <p className="text-sm text-muted-foreground">
            {formatPostDate(post.publishedAt, lang)}
          </p>
          {translation && (
            <div className="flex items-center rounded-lg border border-border text-xs font-medium overflow-hidden" role="group" aria-label="Language">
              {(["en", "de"] as const).map((l) => {
                const active = l === lang;
                return active ? (
                  <span key={l} aria-current="true" className="px-2 py-0.5 bg-accent text-foreground uppercase">
                    {l}
                  </span>
                ) : (
                  <Link
                    key={l}
                    href={hrefFor(translation)}
                    className="px-2 py-0.5 text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors uppercase"
                  >
                    {l}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <div className="my-6 flex w-full items-center">
        <div
          className="flex-1 h-px bg-border"
          style={{
            maskImage:
              "linear-gradient(90deg, transparent, black 8%, black 92%, transparent)",
            WebkitMaskImage:
              "linear-gradient(90deg, transparent, black 8%, black 92%, transparent)",
          }}
        />
      </div>
      <article className="prose max-w-full text-pretty font-sans leading-relaxed text-muted-foreground dark:prose-invert">
        <MDXContent code={post.mdx} components={mdxComponents} />
      </article>

      <nav className="mt-12 pt-8 max-w-2xl">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          {previousPost ? (
            <Link
              href={hrefFor(previousPost)}
              className="group flex-1 flex flex-col gap-1 p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors"
            >
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <ChevronLeft className="size-3" />
                Previous
              </span>
              <span className="text-sm font-medium group-hover:text-foreground transition-colors whitespace-normal wrap-break-word">
                {previousPost.title}
              </span>
            </Link>
          ) : (
            <div className="hidden sm:block flex-1" />
          )}

          {nextPost ? (
            <Link
              href={hrefFor(nextPost)}
              className="group flex-1 flex flex-col gap-1 p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors text-right"
            >
              <span className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
                Next
                <ChevronRight className="size-3" />
              </span>
              <span className="text-sm font-medium group-hover:text-foreground transition-colors whitespace-normal wrap-break-word">
                {nextPost.title}
              </span>
            </Link>
          ) : (
            <div className="hidden sm:block flex-1" />
          )}
        </div>
      </nav>
    </section>
  );
}
