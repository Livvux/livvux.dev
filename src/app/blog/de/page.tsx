import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { getPosts, hrefFor } from "@/lib/posts";
import { paginate } from "@/lib/pagination";
import { BLOG_PAGE_SIZE, parseBlogPage } from "@/lib/blog-pagination";
import { absoluteUrl, pageMetadata, postUrl } from "@/lib/seo";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { StructuredData } from "@/components/structured-data";
import { UmamiPageview } from "@/components/umami-pageview";

function dePageHref(page: number) { return page === 1 ? "/blog/de" : `/blog/de?page=${page}`; }

type BlogPageProps = { searchParams: Promise<{ page?: string | string[] }> };

async function archiveState(searchParams: BlogPageProps["searchParams"]) {
  const { page: requestedPage } = await searchParams;
  const posts = getPosts("de");
  const page = parseBlogPage(requestedPage, Math.ceil(posts.length / BLOG_PAGE_SIZE));
  if (page === null) notFound();
  // One URL for the first page; normalize ?page=02 instead of duplicating page 2.
  if (requestedPage !== undefined && (page === 1 || requestedPage !== String(page))) {
    permanentRedirect(dePageHref(page));
  }
  return { posts, page };
}

export async function generateMetadata({ searchParams }: BlogPageProps): Promise<Metadata> {
  const { page } = await archiveState(searchParams);
  const title = page === 1 ? "Blog: KI, Entwicklung & Open Source" : `Blog — Seite ${page}`;
  const description = `${page > 1 ? `Seite ${page}: ` : ""}Artikel über KI, Softwareentwicklung, Open Source und eigene Projekte von Lucas Kleipoedszus.`;
  const metadata = pageMetadata({
    title,
    description,
    path: dePageHref(page),
    image: "/blog/opengraph-image",
  });
  return { ...metadata,
    alternates: { canonical: absoluteUrl(dePageHref(page)), ...(page === 1 ? { languages: { en: absoluteUrl("/blog"), de: absoluteUrl("/blog/de") } } : {}) },
    openGraph: { ...metadata.openGraph, locale: "de_DE" },
  };
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const { posts, page } = await archiveState(searchParams);
  const { items, pagination } = paginate(posts, { page, pageSize: BLOG_PAGE_SIZE });
  const path = dePageHref(page);
  return (
    <main id="blog" lang="de">
      <UmamiPageview path="/blog/de" title="Blog: KI, Entwicklung & Open Source" ownerKey={`blog-de:${page}`} />
      <Breadcrumbs items={[{ name: "Startseite", href: "/" }, { name: "Blog", href: "/blog/de" }, ...(page > 1 ? [{ name: `Seite ${page}`, href: path }] : [])]} />
      <StructuredData data={{
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "@id": absoluteUrl(path),
        url: absoluteUrl(path),
        name: page === 1 ? "Blog" : `Blog — Seite ${page}`,
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
        Blog{page > 1 ? ` — Seite ${page}` : ""}
        <span className="ml-2 bg-card border border-border rounded-md px-2 py-1 text-muted-foreground text-sm">{posts.length} Artikel</span>
      </h1>
      <p className="text-sm text-muted-foreground mb-3">Artikel über KI, Entwicklung, Open Source und eigene Projekte.</p>
      <nav aria-label="Blogsprache" className="mb-8 flex gap-3 text-sm"><Link href="/blog" hrefLang="en" className="underline underline-offset-4">English</Link><span aria-current="page" className="font-semibold">Deutsch</span></nav>
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
      ) : <p className="text-muted-foreground py-12">Noch keine Blogartikel vorhanden.</p>}
      {pagination.totalPages > 1 && (
        <nav aria-label="Blogseitennavigation" className="mt-8 space-y-4">
          <p className="text-sm text-muted-foreground">Seite {page} von {pagination.totalPages}</p>
          <div className="flex flex-wrap gap-2">
            {pagination.hasPreviousPage && <Link href={dePageHref(page - 1)} rel="prev" className="rounded-lg border px-3 py-2 text-sm hover:bg-accent/50">Zurück</Link>}
            {Array.from({ length: pagination.totalPages }, (_, index) => index + 1).map((number) => (
              <Link key={number} href={dePageHref(number)} aria-label={`Seite ${number}`} aria-current={page === number ? "page" : undefined} className="rounded-lg border px-3 py-2 text-sm hover:bg-accent/50 aria-[current=page]:bg-accent">{number}</Link>
            ))}
            {pagination.hasNextPage && <Link href={dePageHref(page + 1)} rel="next" className="rounded-lg border px-3 py-2 text-sm hover:bg-accent/50">Weiter</Link>}
          </div>
        </nav>
      )}
    </main>
  );
}
