import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");
const article = (lang) => read(`content/openseo-seo-data-not-subscriptions/${lang}.mdx`);
const images = [
  "https://imagedelivery.net/ysLOa6bzFaM49Jxok-TAlw/d77077d0-cdf4-4523-0c41-56a7b4861300/public",
  "https://imagedelivery.net/ysLOa6bzFaM49Jxok-TAlw/cde3e4f8-079f-4890-cb17-371087107400/public",
];
const sources = [
  "https://github.com/every-app/open-seo",
  "https://github.com/every-app/open-seo/blob/main/LICENSE",
  "https://openalternative.co/openseo",
  "https://x.com/ossalternative/status/2102518350178091297",
  "https://openseo.so/docs/self-hosting",
  "https://openseo.so/pricing",
  "https://dataforseo.com/pricing",
  "https://dataforseo.com/update/pricing-update-in-dataforseo-apis",
];

for (const lang of ["en", "de"]) {
  test(`${lang}: follows the existing bilingual frontmatter convention`, () => {
    const content = article(lang);
    const frontmatter = content.match(/^---\n([\s\S]*?)\n---\n/);
    assert.ok(frontmatter);
    for (const field of ["title", "publishedAt", "author", "summary"]) {
      assert.match(frontmatter[1], new RegExp(`^${field}: ".+"$`, "m"));
    }
    assert.match(frontmatter[1], /publishedAt: "2026-09-23"/);
    // This site's metadata prepends DATA.url: never pass it a remote cover URL.
    assert.doesNotMatch(frontmatter[1], /^image:/m);
    assert.ok(content.split(/\s+/).length > 900);
  });

  test(`${lang}: includes requested links, primary sources and the actual tweet ID`, () => {
    const content = article(lang);
    for (const source of sources) assert.ok(content.includes(source), source);
    assert.ok(content.includes(`<TweetEmbed id="2102518350178091297" lang="${lang}" />`));
    assert.ok(content.includes(lang === "de" ? "/blog/code-must-be-free/de" : "/blog/code-must-be-free)"));
    assert.match(content, /Semrush/);
    assert.match(content, /Ahrefs/);
    assert.match(content, /DataForSEO/);
    assert.doesNotMatch(content, /<script\b|dangerouslySetInnerHTML|imagegen|sandbox:/);
  });

  test(`${lang}: uses only the two verified publisher screenshots with attribution`, () => {
    const content = article(lang);
    const tags = [...content.matchAll(/<img\s[^>]*\/\s*>/g)].map(([tag]) => tag);
    assert.equal(tags.length, images.length);
    assert.deepEqual(tags.map((tag) => tag.match(/src="([^"]+)"/)[1]), images);
    for (const tag of tags) {
      assert.match(tag, /alt="[^"]{25,}"/);
      assert.match(tag, /width="1000" height="730"/);
      assert.match(tag, /loading="lazy"/);
      assert.match(tag, /referrerPolicy="no-referrer"/);
    }
    assert.equal((content.match(/<figcaption>/g) || []).length, 2);
    assert.equal((content.match(/<figure>/g) || []).length, 2);
    assert.equal((content.match(/<\/figure>/g) || []).length, 2);
  });
}

test("the tweet component is registered without removing existing MDX components", () => {
  const source = read("src/mdx-components.tsx");
  assert.match(source, /import \{ TweetEmbed \} from "@\/components\/mdx\/tweet-embed"/);
  for (const component of ["MediaContainer", "MarketShareChart", "SyncComparison", "TweetEmbed"]) {
    assert.match(source, new RegExp(`^  ${component},`, "m"));
  }
});

test("tweet embed keeps a link fallback and an opt-in, timeout and cleanup path", () => {
  const source = read("src/components/mdx/tweet-embed.tsx");
  assert.match(source, /^"use client"/);
  assert.match(source, /enabled && \(\s*<Script/);
  assert.match(source, /https:\/\/platform\.twitter\.com\/widgets\.js/);
  assert.match(source, /api\.widgets\.createTweet\(id, target/);
  assert.match(source, /dnt: true/);
  assert.match(source, /15000/);
  assert.match(source, /target\.remove\(\)/);
  assert.match(source, /href=\{href\}/);
  assert.match(source, /Read the original post on X/);
  assert.match(source, /Originalbeitrag auf X lesen/);
});

for (const path of ["src/components/mdx/tweet-embed.tsx", "src/mdx-components.tsx"]) {
  test(`${path}: TypeScript/JSX syntax transpiles`, () => {
    const result = ts.transpileModule(read(path), {
      fileName: path,
      reportDiagnostics: true,
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.ESNext,
        jsx: ts.JsxEmit.ReactJSX,
        isolatedModules: true,
      },
    });
    const errors = (result.diagnostics || []).filter((d) => d.category === ts.DiagnosticCategory.Error);
    assert.deepEqual(errors.map((d) => ts.flattenDiagnosticMessageText(d.messageText, "\n")), []);
  });
}
