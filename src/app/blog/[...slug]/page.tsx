import { allPosts } from "content-collections";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MDXContent } from "@content-collections/mdx/react";
import { mdxComponents } from "@/mdx-components";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { findPost, getPosts, getRelatedPosts, hrefFor, postId, postLang, translationOf, type PostLang } from "@/lib/posts";
import { postAuthor, postDates, postMetadata, postStructuredData } from "@/lib/seo";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { StructuredData } from "@/components/structured-data";
import { UmamiPageview } from "@/components/umami-pageview";

// Unknown and malformed article URLs are real 404s, not empty indexable pages.
export const dynamicParams = false;

function formatPostDate(date: string, lang: PostLang) {
  return new Intl.DateTimeFormat(lang === "de" ? "de-DE" : "en-US", {
    day: "numeric", month: "long", year: "numeric", timeZone: "UTC",
  }).format(new Date(date));
}

export async function generateStaticParams() {
  return allPosts.map((post) => ({ slug: postLang(post) === "de" ? [postId(post), "de"] : [postId(post)] }));
}

type BlogProps = { params: Promise<{ slug: string[] }> };

export async function generateMetadata({ params }: BlogProps): Promise<Metadata> {
  const post = findPost((await params).slug);
  if (!post) notFound();
  return postMetadata(post);
}

export default async function Blog({ params }: BlogProps) {
  const post = findPost((await params).slug);
  if (!post) notFound();

  const lang = postLang(post);
  const de = lang === "de";
  const translation = translationOf(post);
  const sortedPosts = getPosts(lang);
  const currentIndex = sortedPosts.findIndex((candidate) => postId(candidate) === postId(post));
  const previousPost = currentIndex > 0 ? sortedPosts[currentIndex - 1] : undefined;
  const nextPost = currentIndex >= 0 ? sortedPosts[currentIndex + 1] : undefined;
  const relatedPosts = getRelatedPosts(post);
  const dates = postDates(post);
  const author = postAuthor(post);

  return (
    <main id="blog" lang={lang}>
      <UmamiPageview path={hrefFor(post)} title={post.title} />
      <StructuredData data={postStructuredData(post)} />
      <Breadcrumbs label={de ? "Brotkrumennavigation" : "Breadcrumb"} items={[
        { name: de ? "Startseite" : "Home", href: "/" },
        { name: "Blog", href: "/blog" },
        { name: post.title, href: hrefFor(post) },
      ]} />
      <header className="flex flex-col gap-4">
        <h1 className="title font-semibold text-3xl md:text-4xl tracking-tighter leading-tight">{post.title}</h1>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
          <span>{de ? "Von " : "By "}{author.url ? <Link href="/" rel="author" className="underline underline-offset-4">{author.name}</Link> : author.name}</span>
          {dates.published && <time dateTime={dates.published}>{formatPostDate(dates.published, lang)}</time>}
          {dates.modified && dates.modified !== dates.published && (
            <span>{de ? "Aktualisiert: " : "Updated: "}<time dateTime={dates.modified}>{formatPostDate(dates.modified, lang)}</time></span>
          )}
          {translation && (
            <nav aria-label={de ? "Artikelsprache" : "Article language"} className="flex items-center rounded-lg border border-border text-xs font-medium overflow-hidden">
              {(["en", "de"] as const).map((language) => language === lang ? (
                <span key={language} aria-current="page" className="px-2 py-1 bg-accent text-foreground uppercase">{language}</span>
              ) : (
                <Link key={language} href={hrefFor(translation)} hrefLang={language} lang={language} className="px-2 py-1 hover:text-foreground hover:bg-accent/50 transition-colors" aria-label={language === "de" ? "Artikel auf Deutsch lesen" : "Read this article in English"}>
                  {language === "de" ? "Deutsch" : "English"}
                </Link>
              ))}
            </nav>
          )}
        </div>
      </header>
      <div className="my-6 h-px bg-border" />
      <article lang={lang} className="prose max-w-full text-pretty font-sans leading-relaxed text-muted-foreground dark:prose-invert">
        <MDXContent code={post.mdx} components={mdxComponents} />
      </article>
      {relatedPosts.length > 0 && (
        <section aria-labelledby="more-articles" className="mt-12 border-t border-border pt-8">
          <h2 id="more-articles" className="text-xl font-semibold mb-4">{de ? "Weitere Artikel" : "More articles"}</h2>
          <ul className="space-y-4">
            {relatedPosts.map((related) => (
              <li key={hrefFor(related)}>
                <Link href={hrefFor(related)} hrefLang={lang} className="font-medium underline underline-offset-4">{related.title}</Link>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{related.summary}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
      <nav aria-label={de ? "Artikelnavigation" : "Article navigation"} className="mt-8 pt-8 border-t border-border">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          {previousPost && (
            <Link href={hrefFor(previousPost)} hrefLang={lang} className="group flex-1 flex flex-col gap-1 p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors">
              <span className="flex items-center gap-1 text-xs text-muted-foreground"><ChevronLeft aria-hidden="true" className="size-3" />{de ? "Vorheriger Artikel" : "Previous article"}</span>
              <span className="text-sm font-medium whitespace-normal wrap-break-word">{previousPost.title}</span>
            </Link>
          )}
          {nextPost && (
            <Link href={hrefFor(nextPost)} hrefLang={lang} className="group flex-1 flex flex-col gap-1 p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors text-right">
              <span className="flex items-center justify-end gap-1 text-xs text-muted-foreground">{de ? "Nächster Artikel" : "Next article"}<ChevronRight aria-hidden="true" className="size-3" /></span>
              <span className="text-sm font-medium whitespace-normal wrap-break-word">{nextPost.title}</span>
            </Link>
          )}
        </div>
        <Link href="/blog" className="mt-6 inline-block text-sm underline underline-offset-4">{de ? "Alle Blogartikel" : "All blog articles"}</Link>
      </nav>
    </main>
  );
}
