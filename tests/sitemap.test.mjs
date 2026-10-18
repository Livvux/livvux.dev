import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

// Execute the real TypeScript routes and post helpers with an isolated content
// collection. No Next server, MDX compilation, network, or new dependency needed.
function loadModule(path, dependencies) {
  const source = readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    fileName: path,
  });
  const loadedModule = { exports: {} };
  const require = (name) => {
    assert.ok(Object.hasOwn(dependencies, name), `Unexpected import: ${name}`);
    return dependencies[name];
  };
  new Function("require", "module", "exports", outputText)(require, loadedModule, loadedModule.exports);
  return loadedModule.exports;
}

const origin = "https://livvux.dev";
const staticPaths = ["/", "/blog", "/tools", "/tools/internal-links", "/tools/crawler", "/imprint", "/imprint/en", "/privacy", "/privacy/de"];
const post = (path, dates = {}) => ({
  _meta: { path },
  publishedAt: "2026-09-01",
  ...dates,
});

function routes(allPosts = [], url = origin) {
  const dependencies = {
    "content-collections": { allPosts },
    "@/data/resume": { DATA: { url } },
  };
  dependencies["@/lib/posts"] = loadModule("src/lib/posts.ts", dependencies);
  return {
    sitemap: loadModule("src/app/sitemap.ts", dependencies).default,
    robots: loadModule("src/app/robots.ts", dependencies).default,
  };
}

function articleEntry(document) {
  return routes([document]).sitemap().find((entry) => entry.url.includes("/blog/"));
}

test("includes all static, indexable pages with absolute HTTPS URLs", () => {
  const entries = routes().sitemap();
  assert.deepEqual(
    entries.map(({ url }) => url).sort(),
    staticPaths.map((path) => new URL(path, origin).href).sort(),
  );
  for (const entry of entries) assert.deepEqual(Object.keys(entry), ["url"]);
});

test("uses the real EN/DE route convention and reciprocal, self-inclusive hreflang", () => {
  const entries = routes([post("example/en"), post("example/de")]).sitemap();
  const articles = entries.filter(({ url }) => url.includes("/blog/"));
  const languages = {
    en: `${origin}/blog/example`,
    de: `${origin}/blog/example/de`,
  };
  assert.equal(articles.length, 2);
  for (const entry of articles) {
    assert.deepEqual(entry.alternates.languages, languages);
    assert.ok(Object.values(languages).includes(entry.url));
    assert.ok(!entry.url.endsWith("/en"));
  }
});

for (const language of ["en", "de"]) {
  test(`${language}-only posts do not invent a translation`, () => {
    const entry = articleEntry(post(`single/${language}`));
    assert.equal(entry.url, `${origin}/blog/single${language === "de" ? "/de" : ""}`);
    assert.equal(entry.alternates, undefined);
  });
}

test("omits content paths the actual page resolver cannot serve", () => {
  const documents = [post("loose"), post("nested/example/en"), post("example/fr")];
  assert.equal(routes(documents).sitemap().length, staticPaths.length);
});

test("deduplicates documents without changing the page resolver's first match", () => {
  const documents = [
    post("example/en"),
    post("example/en", { updatedAt: "2026-09-20" }),
  ];
  const entries = routes(documents).sitemap();
  assert.equal(entries.length, staticPaths.length + 1);
  assert.equal(new Set(entries.map(({ url }) => url)).size, entries.length);
  assert.equal(entries.find(({ url }) => url.endsWith("/example")).lastModified, "2026-09-01");
});

test("uses updatedAt for the relevant language and publishedAt only when no update exists", () => {
  const entries = routes([
    post("example/en", { updatedAt: "2026-09-24" }),
    post("example/de"),
  ]).sitemap();
  assert.equal(entries.find(({ url }) => url.endsWith("/example")).lastModified, "2026-09-24");
  assert.equal(entries.find(({ url }) => url.endsWith("/example/de")).lastModified, "2026-09-01");
});

for (const value of [
  "2024-02-29",
  "2026-09-24T14:30:00Z",
  "2026-09-24T16:30:00.123+02:00",
  "2026-09-24T16:30+02:00",
]) {
  test(`preserves valid W3C content date: ${value}`, () => {
    assert.equal(articleEntry(post("example/en", { updatedAt: value })).lastModified, value);
  });
}

for (const value of [
  "not-a-date", "", "09/24/2026", "2026-02-30", "2025-02-29", "2026-13-01",
  "2026-09-24T16:30:00", "2026-09-24T24:00:00Z",
]) {
  test(`omits invalid/ambiguous lastmod without falling back to publication: ${value}`, () => {
    const entry = articleEntry(post("example/en", { updatedAt: value }));
    assert.equal(Object.hasOwn(entry, "lastModified"), false);
  });
}

test("omits an invalid publication date when there is no explicit update", () => {
  assert.equal(articleEntry(post("example/en", { publishedAt: "invalid" })).lastModified, undefined);
});

test("encodes special characters as path segments without raw XML delimiters", () => {
  const entry = articleEntry(post('tips & "café"/en'));
  assert.equal(entry.url, `${origin}/blog/tips%20%26%20%22caf%C3%A9%22`);
  assert.doesNotMatch(entry.url, /[<>&"\s]/);
  assert.equal(new URL(entry.url).search, "");
  assert.equal(new URL(entry.url).hash, "");
});

test("is stable, does not mutate content, and omits priority/changefreq", () => {
  const documents = [post("zebra/de"), post("alpha/en"), post("zebra/en")];
  const before = structuredClone(documents);
  const { sitemap } = routes(documents);
  const entries = sitemap();
  assert.deepEqual(sitemap(), entries);
  assert.deepEqual(documents, before);
  assert.deepEqual(entries, [...entries].sort((a, b) => a.url.localeCompare(b.url)));
  for (const entry of entries) {
    assert.equal(entry.priority, undefined);
    assert.equal(entry.changeFrequency, undefined);
    assert.doesNotMatch(new URL(entry.url).pathname, /^\/(?:api|_next)\//);
  }
});

test("normalizes a trailing slash on the configured canonical origin", () => {
  assert.deepEqual(routes([], `${origin}/`).sitemap(), routes().sitemap());
});

test("robots advertises the sitemap and allows public pages and rendering assets", () => {
  const result = routes().robots();
  assert.deepEqual(result.rules, { userAgent: "*", allow: "/", disallow: "/api/" });
  assert.equal(result.sitemap, `${origin}/sitemap.xml`);
  assert.deepEqual(routes([], `${origin}/`).robots(), result);
});
