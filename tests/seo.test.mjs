import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

// Exercise real source with isolated content fixtures; no network/Next server.
function loadModule(path, dependencies = {}) {
  const source = readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
  const { outputText, diagnostics = [] } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
    fileName: path.replace(/\.mjs$/, ".ts"),
    reportDiagnostics: true,
  });
  assert.equal(diagnostics.filter((entry) => entry.category === ts.DiagnosticCategory.Error).length, 0, `Syntax error in ${path}`);
  const loaded = { exports: {} };
  const require = (name) => {
    assert.ok(Object.hasOwn(dependencies, name), `Unexpected import in ${path}: ${name}`);
    return dependencies[name];
  };
  new Function("require", "module", "exports", outputText)(require, loaded, loaded.exports);
  return loaded.exports;
}

const origin = "https://livvux.dev";
const DATA = {
  name: "Lucas Kleipoedszus", url: origin, avatarUrl: "/me.png", description: "Developer portfolio",
  contact: { social: { GitHub: { url: "https://github.com/Livvux" }, email: { url: "#" } } },
};
const document = (path, fields = {}) => ({
  _meta: { path }, title: "Open-source developer tools", summary: "Practical software development tools.", publishedAt: "2026-09-01", mdx: "", ...fields,
});
function modules(documents = []) {
  const dependencies = { "content-collections": { allPosts: documents }, "@/data/resume": { DATA } };
  const posts = loadModule("src/lib/posts.ts", dependencies);
  dependencies["@/lib/posts"] = posts;
  const seo = loadModule("src/lib/seo.ts", dependencies);
  dependencies["@/lib/seo"] = seo;
  return { posts, seo, dependencies };
}
const pagination = loadModule("src/lib/blog-pagination.ts");

function routeModules(documents) {
  const result = modules(documents);
  const jsx = (type, props) => ({ type, props });
  Object.assign(result.dependencies, {
    "react/jsx-runtime": { jsx, jsxs: jsx, Fragment: "Fragment" },
    "next/link": () => {},
    "next/navigation": {
      notFound: () => { throw new Error("NOT_FOUND"); },
      permanentRedirect: (url) => { throw new Error(`REDIRECT:${url}`); },
    },
    "lucide-react": { ChevronLeft: () => {}, ChevronRight: () => {} },
    "@content-collections/mdx/react": { MDXContent: () => {} },
    "@/mdx-components": { mdxComponents: {} },
    "@/components/breadcrumbs": { Breadcrumbs: () => {} },
    "@/components/structured-data": { StructuredData: () => {} },
    "@/lib/blog-pagination": pagination,
    "@/lib/pagination": {},
  });
  return {
    archive: loadModule("src/app/blog/page.tsx", result.dependencies),
    article: loadModule("src/app/blog/[...slug]/page.tsx", result.dependencies),
    ...result,
  };
}

test("static metadata agrees across canonical, Open Graph and Twitter", () => {
  const { seo } = modules();
  const meta = seo.pageMetadata({ title: "Tools", description: "Useful website tools", path: "/tools" });
  assert.equal(meta.alternates.canonical, `${origin}/tools`);
  assert.equal(meta.openGraph.url, meta.alternates.canonical);
  assert.equal(meta.twitter.title, "Tools");
  assert.equal(meta.twitter.description, meta.description);
  assert.equal(meta.openGraph.images[0].url, `${origin}/opengraph-image`);
  assert.deepEqual(meta.twitter.images, meta.openGraph.images);
});

test("archive pages use distinct self-canonicals, not page-one canonicals", () => {
  const { seo } = modules();
  assert.equal(pagination.blogPageHref(1), "/blog");
  assert.equal(pagination.blogPageHref(2), "/blog?page=2");
  assert.equal(seo.pageMetadata({ title: "Page 2", description: "Archive", path: pagination.blogPageHref(2) }).alternates.canonical, `${origin}/blog?page=2`);
});

test("pagination rejects junk, repeated parameters, fractions, and huge/out-of-range pages", () => {
  for (const value of ["", "0", "-1", "2abc", "1.5", "1e2", "Infinity", " 2", "999", "999999999999999999999", ["1", "2"]]) {
    assert.equal(pagination.parseBlogPage(value, 10), null, String(value));
  }
  assert.equal(pagination.parseBlogPage(undefined, 0), 1);
  assert.equal(pagination.parseBlogPage("1", 0), 1);
  assert.equal(pagination.parseBlogPage("02", 10), 2);
  assert.equal(pagination.parseBlogPage("10", 10), 10);
});

test("archive metadata normalizes duplicates and rejects invalid pages through Next navigation", async () => {
  const { archive } = routeModules(Array.from({ length: 6 }, (_, index) => document(`post-${index}/en`)));
  for (const page of ["1", "01"]) {
    await assert.rejects(archive.generateMetadata({ searchParams: Promise.resolve({ page }) }), /REDIRECT:\/blog$/);
  }
  await assert.rejects(archive.generateMetadata({ searchParams: Promise.resolve({ page: "02" }) }), /REDIRECT:\/blog\?page=2$/);
  for (const page of ["3", "2junk", ["1", "2"]]) {
    await assert.rejects(archive.generateMetadata({ searchParams: Promise.resolve({ page }) }), /NOT_FOUND/);
  }
  const metadata = await archive.generateMetadata({ searchParams: Promise.resolve({ page: "2" }) });
  assert.equal(metadata.alternates.canonical, `${origin}/blog?page=2`);
  assert.match(metadata.title, /Page 2/);
});

test("EN/DE metadata links reciprocally to existing translations with English x-default", () => {
  const en = document("example/en");
  const de = document("example/de");
  const { seo } = modules([en, de]);
  for (const post of [en, de]) {
    const meta = seo.postMetadata(post);
    assert.deepEqual(meta.alternates.languages, { en: `${origin}/blog/example`, de: `${origin}/blog/example/de`, "x-default": `${origin}/blog/example` });
    assert.equal(meta.openGraph.url, meta.alternates.canonical);
    assert.equal(meta.twitter.images[0].url, seo.postStructuredData(post).image[0]);
    assert.equal(meta.openGraph.locale, post === de ? "de_DE" : "en_US");
  }
});

for (const lang of ["en", "de"]) {
  test(`${lang}-only articles never advertise a nonexistent translation`, () => {
    const post = document(`only/${lang}`);
    const { seo } = modules([post]);
    const meta = seo.postMetadata(post);
    assert.equal(meta.alternates.languages, undefined);
    assert.equal(meta.openGraph.alternateLocale, undefined);
    assert.equal(meta.alternates.canonical, `${origin}/blog/only${lang === "de" ? "/de" : ""}`);
  });
}

test("absolute external images are not prefixed with the site origin", () => {
  const post = document("example/en", { image: "https://images.example.com/photo.jpg" });
  const { seo } = modules([post]);
  assert.equal(seo.postMetadata(post).openGraph.images[0].url, post.image);
  assert.deepEqual(seo.postStructuredData(post).image, [post.image]);
  assert.equal(seo.postMetadata(post).openGraph.images[0].width, undefined);
});

test("relative images and generated previews resolve to the correct language URL", () => {
  const { seo } = modules();
  assert.equal(seo.postImage(document("example/de")), `${origin}/blog/og/example/de`);
  assert.equal(seo.postImage(document("example/en", { image: "/images/photo.jpg" })), `${origin}/images/photo.jpg`);
  assert.equal(seo.imageUrl("javascript:alert(1)", "/opengraph-image"), `${origin}/opengraph-image`);
  assert.equal(seo.imageUrl("http://[", "/opengraph-image"), `${origin}/opengraph-image`);
});

test("post canonicals encode content segments like the sitemap", () => {
  const { seo } = modules();
  assert.equal(seo.postUrl(document('tips & "café"/en')), `${origin}/blog/tips%20%26%20%22caf%C3%A9%22`);
});

test("editorial update dates agree across Open Graph and structured data", () => {
  const post = document("example/en", { updatedAt: "2026-09-24" });
  const { seo } = modules([post]);
  assert.equal(seo.postStructuredData(post).dateModified, post.updatedAt);
  assert.equal(seo.postMetadata(post).openGraph.modifiedTime, post.updatedAt);
  assert.equal(seo.postStructuredData(post).datePublished, post.publishedAt);
});

test("invalid/ambiguous editorial dates are omitted instead of invented", () => {
  const { seo } = modules();
  for (const value of ["", "invalid", "2026-02-30", "2025-02-29", "2026-09-24T12:30:00", "2026-09-24T24:00:00Z"]) {
    assert.equal(seo.postStructuredData(document("example/en", { updatedAt: value })).dateModified, undefined);
  }
  assert.equal(seo.editorialDate("2024-02-29"), "2024-02-29");
  assert.equal(seo.editorialDate("2026-09-24T16:30:00+02:00"), "2026-09-24T16:30:00+02:00");
});

test("article authors have a real profile URL without misattributing guest authors", () => {
  const { seo } = modules();
  assert.equal(seo.postStructuredData(document("example/en")).author.url, `${origin}/`);
  const guest = document("guest/en", { author: "Guest Author" });
  assert.equal(seo.postStructuredData(guest).author.name, "Guest Author");
  assert.equal(seo.postStructuredData(guest).author.url, undefined);
  assert.equal(seo.postMetadata(guest).authors[0].name, "Guest Author");
});

test("JSON-LD cannot break out of its script element", () => {
  const { seo } = modules();
  const data = { headline: '</script><script>alert("x")</script>' };
  const json = seo.serializeJsonLd(data);
  assert.doesNotMatch(json, /</);
  assert.deepEqual(JSON.parse(json), data);
});

test("site schema uses real profile links and does not invent a search action", () => {
  const { seo } = modules();
  const [site, person] = seo.siteStructuredData()["@graph"];
  assert.equal(site["@type"], "WebSite");
  assert.equal(site.publisher["@id"], person["@id"]);
  assert.deepEqual(person.sameAs, ["https://github.com/Livvux"]);
  assert.equal(site.potentialAction, undefined);
});

test("breadcrumbs have consecutive positions and absolute, canonical URLs", () => {
  const { seo } = modules();
  const data = seo.breadcrumbStructuredData([{ name: "Home", href: "/" }, { name: "Blog", href: "/blog" }]);
  assert.deepEqual(data.itemListElement.map((item) => item.position), [1, 2]);
  assert.deepEqual(data.itemListElement.map((item) => item.item), [`${origin}/`, `${origin}/blog`]);
});

test("article navigation stays in its language while the archive remains EN-preferred", () => {
  const documents = [document("one/en"), document("one/de"), document("two/en"), document("three/de")];
  const { posts } = modules(documents);
  assert.deepEqual(posts.getPosts("de").map((post) => post._meta.path), ["one/de", "three/de"]);
  assert.deepEqual(posts.getPosts().map((post) => post._meta.path), ["one/en", "three/de", "two/en"]);
});

test("related articles prioritize shared topics and exclude self and other languages", () => {
  const current = document("wordpress/de", { title: "WordPress SEO", summary: "Interne Links verbessern" });
  const related = document("seo/de", { title: "WordPress Links", summary: "SEO verbessern", publishedAt: "2026-08-01" });
  const documents = [current, related, document("wordpress/en"), document("other/de", { title: "Musik", summary: "Klavier stimmen" })];
  const before = structuredClone(documents);
  const { posts } = modules(documents);
  assert.equal(posts.getRelatedPosts(current, 1)[0], related);
  assert.ok(posts.getRelatedPosts(current).every((post) => posts.postLang(post) === "de" && posts.postId(post) !== "wordpress"));
  assert.deepEqual(posts.getRelatedPosts(current, 0), []);
  assert.deepEqual(documents, before);
});

test("unknown article metadata calls notFound rather than inheriting the homepage", async () => {
  const { article } = routeModules([document("example/en")]);
  assert.equal(article.dynamicParams, false);
  await assert.rejects(article.generateMetadata({ params: Promise.resolve({ slug: ["missing"] }) }), /NOT_FOUND/);
  const meta = await article.generateMetadata({ params: Promise.resolve({ slug: ["example"] }) });
  assert.equal(meta.alternates.canonical, `${origin}/blog/example`);
});

test("API noindex headers are narrowly scoped and all legacy redirects survive", async () => {
  const config = loadModule("next.config.mjs", { "@content-collections/next": { withContentCollections: (value) => value } }).default;
  const headers = await config.headers();
  const noindex = headers.filter((rule) => rule.headers.some((header) => header.key === "X-Robots-Tag"));
  assert.deepEqual(noindex, [{ source: "/api/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] }]);
  const redirects = await config.redirects();
  assert.equal(redirects.length, 6);
  assert.ok(redirects.every((entry) => entry.permanent && entry.destination.endsWith("/de")));
});
