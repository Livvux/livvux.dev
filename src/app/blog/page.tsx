import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { getPosts, hrefFor } from "@/lib/posts";
import { paginate } from "@/lib/pagination";
import { BLOG_PAGE_SIZE, blogPageHref, parseBlogPage } from "@/lib/blog-pagination";
import { absoluteUrl, pageMetadata, postUrl } from "@/lib/seo";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { StructuredData } from "@/components/structured-data";
import { UmamiPageview } from "@/components/umami-pageview";

type BlogPageProps = { searchParams: Promise<{ page?: string | string[] }> };

async function archiveState(searchParams: BlogPageProps["searchParams"]) {
  const { page: requestedPage } = await searchParams;
  const posts = getPosts();
  const page = parseBlogPage(requestedPage, Math.ceil(posts.length / BLOG_PAGE_SIZE));
  if (page === null) notFound();
  // One URL for the first page; normalize ?page=02 instead of duplicating page 2.
  if (requestedPage !== undefined && (page === 1 || requestedPage !== String(page))) {
    permanentRedirect(blogPageHref(page));
  }
  return { posts, page };
}

export async function generateMetadata({ searchParams }: BlogPageProps): Promise<Metadata> {
  const { page } = await archiveState(searchParams);
  return {
    ...pageMetadata({
    title: page === 1 ? "Blog: AI, Development & Open Source" : `Blog — Page ${page}`,
    description: `${page > 1 ? `Page ${page}: ` : ""}Practical articles on AI, software development, open-source tools and building in public by Lucas Kleipoedszus. Available in English and German.`,
    path: blogPageHref(page),
    image: "/blog/opengraph-image",
    }),
    alternates: { canonical: absoluteUrl(blogPageHref(page)), ...(page === 1 ? { languages: { en: absoluteUrl("/blog"), de: absoluteUrl("/blog/de") } } : {}) },
  };
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const { posts, page } = await archiveState(searchParams);
  const { items, pagination } = paginate(posts, { page, pageSize: BLOG_PAGE_SIZE });
  const path = blogPageHref(page);
  return (
    <main id="blog">
      <UmamiPageview path="/blog" title="Blog: AI, Development & Open Source" ownerKey={`blog:${page}`} />
      <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Blog", href: "/blog" }, ...(page > 1 ? [{ name: `Page ${page}`, href: path }] : [])]} />
      <StructuredData data={{
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "@id": absoluteUrl(path),
        url: absoluteUrl(path),
        name: page === 1 ? "Blog" : `Blog — Page ${page}`,
        isPartOf: { "@id": absoluteUrl("/#website") },
        mainEntity: {
          "@type": "ItemList",
          numberOfItems: items.length,
          itemListElement: items.map((post, index) => ({
            "@type": "ListItem",
            position: (page - 1) * BLOG_PAGE_SIZE + index + 1,
            name: post.title,
            url: postUrl(post),
          })),
        },
      }} />
      <h1 className="text-2xl font-semibold tracking-tight mb-2">
        Blog{page > 1 ? ` — Page ${page}` : ""}
        <span className="ml-2 bg-card border border-border rounded-md px-2 py-1 text-muted-foreground text-sm">{posts.length} posts</span>
      </h1>
      <p className="text-sm text-muted-foreground mb-3">Notes on AI, development, open source, and building in public.</p>
      <nav aria-label="Blog language" className="mb-8 flex gap-3 text-sm"><span aria-current="page" className="font-semibold">English</span><Link href="/blog/de" hrefLang="de" className="underline underline-offset-4">Deutsch</Link></nav>
      {items.length > 0 ? (
        <ol start={(page - 1) * BLOG_PAGE_SIZE + 1} className="flex flex-col gap-6">
          {items.map((post) => (
            <li key={hrefFor(post)}>
              <article className="space-y-2">
                <h2 className="tracking-tight text-lg font-medium">
                  <Link href={hrefFor(post)} className="hover:underline underline-offset-4 focus-visible:underline">{post.title}</Link>
                </h2>
                <time dateTime={post.publishedAt} className="block text-xs text-muted-foreground">{post.publishedAt.slice(0, 10)}</time>
                <p className="text-sm text-muted-foreground leading-relaxed">{post.summary}</p>
              </article>
            </li>
          ))}
        </ol>
      ) : <p className="text-muted-foreground py-12">No blog posts yet. Check back soon!</p>}
      {pagination.totalPages > 1 && (
        <nav aria-label="Blog pagination" className="mt-8 space-y-4">
          <p className="text-sm text-muted-foreground">Page {page} of {pagination.totalPages}</p>
          <div className="flex flex-wrap gap-2">
            {pagination.hasPreviousPage && <Link href={blogPageHref(page - 1)} rel="prev" className="rounded-lg border px-3 py-2 text-sm hover:bg-accent/50">Previous</Link>}
            {Array.from({ length: pagination.totalPages }, (_, index) => index + 1).map((number) => (
              <Link key={number} href={blogPageHref(number)} aria-label={`Page ${number}`} aria-current={page === number ? "page" : undefined} className="rounded-lg border px-3 py-2 text-sm hover:bg-accent/50 aria-[current=page]:bg-accent">{number}</Link>
            ))}
            {pagination.hasNextPage && <Link href={blogPageHref(page + 1)} rel="next" className="rounded-lg border px-3 py-2 text-sm hover:bg-accent/50">Next</Link>}
          </div>
        </nav>
      )}
    </main>
  );
}
