import assert from "node:assert/strict";
import { test } from "node:test";
import { isExternalHref, getExternalLinkProps } from "../src/lib/external-links.ts";
import { remarkContentLinks } from "../src/lib/remark-content-links.ts";

for (const href of [
  "https://github.com/Livvux",
  "http://example.com/article",
  "//example.com/article",
  "HTTPS://EXAMPLE.COM/article",
  "  https://example.com/article  ",
  "https://livvux.dev.example.com/",
  "https://livvux.dev@evil.example/",
  "https://livvux.dev:444/blog",
  "https://livvux.com/",
  "https://pfotenweb.de/",
]) {
  test(`external destination opens safely in a new tab: ${href}`, () => {
    assert.equal(isExternalHref(href), true);
    assert.deepEqual(getExternalLinkProps(href), {
      target: "_blank",
      rel: "noopener noreferrer",
    });
  });
}

for (const href of [
  undefined,
  "",
  "/blog",
  "blog/article",
  "../article",
  "#sources",
  "?lang=de",
  "https://livvux.dev/blog",
  "https://LIVVUX.DEV:443/blog?lang=de#sources",
  "//livvux.dev/blog",
  "mailto:hello@livvux.dev",
  "tel:+49123456789",
  "sms:+49123456789",
  "blob:https://livvux.dev/1234",
  "data:text/plain,hello",
  "javascript:void(0)",
  "https://[invalid",
]) {
  test(`internal, non-web or invalid destination is left alone: ${String(href)}`, () => {
    assert.equal(isExternalHref(href), false);
    assert.deepEqual(getExternalLinkProps(href, "author"), {});
  });
}

test("preserves useful rel tokens, deduplicates and removes opener", () => {
  assert.deepEqual(
    getExternalLinkProps("https://example.com", "nofollow sponsored UGC NOOPENER opener noreferrer nofollow"),
    { target: "_blank", rel: "nofollow sponsored ugc noopener noreferrer" },
  );
});

test("external attributes override an explicit same-tab target", () => {
  const props = { href: "https://example.com", target: "_self", rel: "author" };
  assert.deepEqual({ ...props, ...getExternalLinkProps(props.href, props.rel) }, {
    href: "https://example.com",
    target: "_blank",
    rel: "author noopener noreferrer",
  });
});

test("internal targets and rel values remain untouched", () => {
  const props = { href: "/blog", target: "_self", rel: "author" };
  assert.deepEqual({ ...props, ...getExternalLinkProps(props.href, props.rel) }, props);
});

test("routes literal MDX anchors through ContentLink, including nested image links", () => {
  const attributes = [
    { type: "mdxJsxAttribute", name: "href", value: "https://example.com" },
    { type: "mdxJsxAttribute", name: "target", value: "_self" },
    { type: "mdxJsxExpressionAttribute", value: "...props" },
  ];
  const inline = { type: "mdxJsxTextElement", name: "a", attributes, children: [{ type: "text", value: "Example" }] };
  const image = { type: "mdxJsxFlowElement", name: "img", attributes: [], children: [] };
  const block = { type: "mdxJsxFlowElement", name: "a", attributes, children: [image] };
  const markdown = { type: "link", url: "https://example.com", children: [{ type: "text", value: "Example" }] };
  const code = { type: "code", value: '<a href="https://example.com">Sample</a>' };
  const custom = { type: "mdxJsxFlowElement", name: "TweetEmbed", attributes: [], children: [] };
  const tree = { type: "root", children: [{ type: "paragraph", children: [inline, markdown] }, { type: "mdxJsxFlowElement", name: "figure", children: [block] }, code, custom] };
  const untouched = structuredClone({ markdown, code, custom, image });

  remarkContentLinks()(tree);
  assert.equal(inline.name, "ContentLink");
  assert.equal(block.name, "ContentLink");
  assert.equal(inline.attributes, attributes);
  assert.equal(block.attributes, attributes);
  assert.deepEqual({ markdown, code, custom, image }, untouched);

  const once = structuredClone(tree);
  remarkContentLinks()(tree);
  assert.deepEqual(tree, once, "running the plugin twice must be harmless");
});

function anchors(html) {
  return [...html.matchAll(/<a\b((?:"[^"]*"|'[^']*'|[^'">])*)>/gi)].map(([, raw]) => {
    const attributes = {};
    for (const [, name, double, single, bare] of raw.matchAll(/([^\s=]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)) {
      attributes[name.toLowerCase()] = double ?? single ?? bare;
    }
    return attributes;
  });
}

test("anchor parser handles quoted greater-than signs", () => {
  assert.deepEqual(anchors('<a title="a > b" href="/blog">Blog</a>'), [
    { title: "a > b", href: "/blog" },
  ]);
});

const baseUrl = process.env.EXTERNAL_LINKS_BASE_URL;
test("production HTML uses new tabs for external links and keeps internal navigation in place", {
  skip: !baseUrl && "Set EXTERNAL_LINKS_BASE_URL to test the built site (CI does this).",
}, async (t) => {
  for (const route of [
    "/",
    "/blog",
    "/blog/code-must-be-free",
    "/blog/code-must-be-free/de",
    "/blog/openseo-seo-data-not-subscriptions",
    "/blog/openseo-seo-data-not-subscriptions/de",
    "/tools/internal-links",
  ]) {
    await t.test(route, async () => {
      const response = await fetch(new URL(route, baseUrl), { signal: AbortSignal.timeout(30000) });
      assert.equal(response.status, 200);
      const html = await response.text();
      const links = anchors(html);
      assert.ok(links.length > 3, `${route}: expected rendered links, not an empty page`);
      assert.ok(links.some(({ href }) => isExternalHref(href)), `${route}: expected external links`);
      for (const link of links) {
        if (isExternalHref(link.href)) {
          assert.equal(link.target, "_blank", `${route}: ${link.href}`);
          const rel = (link.rel ?? "").toLowerCase().split(/\s+/);
          assert.ok(rel.includes("noopener") && rel.includes("noreferrer"), `${route}: unsafe rel for ${link.href}`);
          assert.ok(!rel.includes("opener"), `${route}: opener must not be restored`);
        } else if (link.href && !link.href.startsWith("mailto:")) {
          assert.notEqual(link.target, "_blank", `${route}: internal link ${link.href} should stay in this tab`);
        }
      }
      if (route.includes("code-must-be-free")) {
        assert.ok(links.some(({ href }) => href === "https://github.com/vercel-labs/agent-browser"), "must include the literal JSX image link");
      }
    });
  }
});
