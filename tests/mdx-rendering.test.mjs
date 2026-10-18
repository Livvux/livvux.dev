import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
const read = (path) => readFileSync(new URL("../" + path, import.meta.url), "utf8");

test("code highlighting is server-side and copy interaction is isolated", () => {
  const render = read("src/components/mdx/code-block.tsx");
  const button = read("src/components/mdx/code-copy-button.tsx");
  assert.doesNotMatch(render, /"use client"/);
  assert.match(render, /codeToHtml/);
  assert.match(render, /CodeCopyButton code=\{source\}/);
  assert.match(button, /"use client"/);
  assert.match(button, /clipboard\.writeText\(code\)/);
  assert.doesNotMatch(button, /shiki/);
});
test("MDX code metadata supports filename as well as title", () => {
  const remark = read("src/lib/remark-code-meta.ts");
  assert.match(remark, /title\|filename/);
  const guide = read("content/how-to-get-cited-by-ai/en.mdx");
  assert.match(guide, /filename="robots\.txt"/);
});
