import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

const source = readFileSync(new URL("../src/lib/umami.ts", import.meta.url), "utf8");
const id = "a1111111-1111-4111-8111-111111111111";

function fixture(url = "https://livvux.dev/", privacy = {}) {
  const calls = [], scripts = [], listeners = new Set();
  const window = { location: new URL(url) };
  const document = {
    visibilityState: "visible",
    createElement: () => {
      const events = {};
      return { dataset: {}, addEventListener: (name, fn) => { events[name] = fn; }, events };
    },
    head: { append: (script) => scripts.push(script) },
    addEventListener: (_name, fn) => listeners.add(fn),
    removeEventListener: (_name, fn) => listeners.delete(fn),
  };
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const loaded = { exports: {} };
  new Function("module", "exports", "window", "document", "navigator", compiled)(loaded, loaded.exports, window, document, privacy);
  return {
    api: loaded.exports, calls, scripts, window, document,
    loaded: async () => {
      window.umami = { track: async (payload) => { calls.push(payload); } };
      scripts[0].events.load();
      await Promise.resolve(); await Promise.resolve();
    },
    visible: () => { document.visibilityState = "visible"; listeners.forEach((fn) => fn()); },
  };
}

test("an empty ID fails closed before any third-party script", () => {
  const f = fixture();
  assert.equal(f.api.startUmamiPage("", "/", "Portfolio"), undefined);
  assert.deepEqual(f.scripts, []);
});

test("the existing preview/noindex gate prevents tracking even with a valid fixture ID", () => {
  const f = fixture(), jsx = (type, props) => ({ type, props });
  const dependencies = {
    react: { createContext: () => ({ Provider: "provider" }), useContext: () => false, useEffect: (effect) => effect() },
    "react/jsx-runtime": { jsx, jsxs: jsx },
    "next/navigation": { usePathname: () => "/" },
    "@/lib/umami": { ...f.api, UMAMI_WEBSITE_ID: id },
  };
  const code = ts.transpileModule(readFileSync(new URL("../src/components/umami-pageview.tsx", import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const loaded = { exports: {} };
  new Function("require", "module", "exports", code)((name) => dependencies[name], loaded, loaded.exports);
  assert.equal(loaded.exports.UmamiProvider({ enabled: false, children: "page" }).props.value, false);
  loaded.exports.UmamiPageview({ path: "/", title: "Portfolio" });
  assert.deepEqual(f.scripts, []);
});

for (const [url, path] of [
  ["https://livvux.dev/", "/"], ["https://www.livvux.dev/blog", "/blog"],
  ["https://livvux.dev/blog/public-article/de", "/blog/public-article/de"],
  ["https://livvux.dev/blog?page=2&utm_source=test#reading", "/blog"],
]) test(`public owner accepted: ${url}`, () => {
  assert.equal(fixture().api.umamiPageAllowed(id, path, new URL(url), {}), true);
});

for (const url of [
  "http://livvux.dev/", "https://livvux.dev:8443/", "https://preview.livvux.dev/",
  "https://livvux.dev.example.com/", "https://localhost/", "https://user:secret@livvux.dev/",
  "https://livvux.dev/tools", "https://livvux.dev/api/internal/blog-status", "https://livvux.dev/private",
  "https://livvux.dev/privacy", "https://livvux.dev/blog/opengraph-image", "https://livvux.dev/blog/article/de/more",
  "https://livvux.dev/blog/article%2Ftoken", "https://livvux.dev/blog/%0Aarticle", "https://livvux.dev/blog/%zz",
]) test(`untrusted/private route rejected: ${url}`, () => {
  const f = fixture(url), path = f.window.location.pathname;
  assert.equal(f.api.startUmamiPage(id, path, "Private"), undefined);
  assert.equal(f.scripts.length, 0);
});

for (const parameter of ["session", "session_id", "token", "access_token", "refreshToken", "code", "state", "key", "email", "orderId", "customer_id", "password", "reset", "auth", "next"]) {
  for (const separator of ["?", "#"]) test(`sensitive ${separator}${parameter} blocks loader`, () => {
    const f = fixture(`https://livvux.dev/${separator}${parameter}=PRIVATE_FIXTURE`);
    assert.equal(f.api.startUmamiPage(id, "/", "Portfolio"), undefined);
    assert.equal(f.scripts.length, 0);
  });
}

for (const privacy of [{ doNotTrack: "1" }, { msDoNotTrack: "1" }, { doNotTrack: "yes" }, { globalPrivacyControl: true }]) {
  test(`privacy preference blocks loader: ${JSON.stringify(privacy)}`, () => {
    const f = fixture("https://livvux.dev/", privacy);
    f.api.startUmamiPage(id, "/", "Portfolio");
    assert.equal(f.scripts.length, 0);
  });
}

test("manual pageview omits query, fragment and referrer, with no automatic duplicate", async () => {
  const f = fixture("https://livvux.dev/blog?page=2&q=PRIVATE_FIXTURE#PRIVATE_FRAGMENT");
  f.api.startUmamiPage(id, "/blog", "Blog", "blog:2");
  assert.equal(f.scripts.length, 1);
  assert.equal(f.scripts[0].src, "https://rpcrate.com/_sr/s.js");
  assert.equal(f.scripts[0].referrerPolicy, "no-referrer");
  assert.equal(f.scripts[0].dataset.autoTrack, "false");
  assert.equal(f.scripts[0].dataset.fetchCredentials, "omit");
  assert.equal(f.calls.length, 0);
  await f.loaded();
  assert.deepEqual(f.calls, [{ website: id, hostname: "livvux.dev", url: "/blog", title: "Blog", referrer: "" }]);
  f.visible();
  assert.equal(f.calls.length, 1);
});

test("React Strict Mode cleanup and remount produce one initial pageview", async () => {
  const f = fixture();
  f.api.startUmamiPage(id, "/", "Portfolio")();
  f.api.startUmamiPage(id, "/", "Portfolio");
  await f.loaded();
  f.api.startUmamiPage(id, "/", "Portfolio");
  await Promise.resolve();
  assert.equal(f.scripts.length, 1);
  assert.equal(f.calls.length, 1);
});

test("committed SPA navigation, pagination and return from an unmeasured tool each count once", async () => {
  const f = fixture();
  let cleanup = f.api.startUmamiPage(id, "/", "Portfolio");
  await f.loaded(); cleanup();
  f.window.location = new URL("https://livvux.dev/blog?page=1");
  cleanup = f.api.startUmamiPage(id, "/blog", "Blog", "blog:1");
  await Promise.resolve(); cleanup();
  f.window.location = new URL("https://livvux.dev/blog?page=2");
  cleanup = f.api.startUmamiPage(id, "/blog", "Blog", "blog:2");
  await Promise.resolve(); cleanup();
  f.window.location = new URL("https://livvux.dev/tools/internal-links?key=PRIVATE_FIXTURE");
  f.api.observeUmamiNavigation(f.window.location.pathname);
  f.window.location = new URL("https://livvux.dev/");
  f.api.startUmamiPage(id, "/", "Portfolio");
  await Promise.resolve();
  assert.deepEqual(f.calls.map((entry) => entry.url), ["/", "/blog", "/blog", "/"]);
  assert.equal(f.scripts.length, 1);
});

test("benign query/hash changes and same-owner rerenders do not count again", async () => {
  const f = fixture();
  let cleanup = f.api.startUmamiPage(id, "/", "Portfolio");
  await f.loaded(); cleanup();
  f.window.location = new URL("https://livvux.dev/?q=PRIVATE_SEARCH#reading");
  f.api.startUmamiPage(id, "/", "Portfolio");
  await Promise.resolve();
  assert.equal(f.calls.length, 1);
});

test("departed routes cannot emit when a delayed script finishes", async () => {
  const f = fixture();
  f.api.startUmamiPage(id, "/", "Portfolio")();
  f.window.location = new URL("https://livvux.dev/tools");
  f.api.observeUmamiNavigation("/tools");
  await f.loaded();
  assert.equal(f.calls.length, 0);
});

test("hidden pages wait for visibility and recheck privacy before sending", async () => {
  const privacy = {}, f = fixture("https://livvux.dev/", privacy);
  f.document.visibilityState = "hidden";
  f.api.startUmamiPage(id, "/", "Portfolio");
  await f.loaded();
  assert.equal(f.calls.length, 0);
  privacy.globalPrivacyControl = true; f.visible();
  assert.equal(f.calls.length, 0);
});

test("tracker failure is contained and never causes application errors", async () => {
  const f = fixture();
  f.api.startUmamiPage(id, "/", "Portfolio");
  f.scripts[0].events.error();
  await Promise.resolve(); await Promise.resolve();
  assert.equal(f.calls.length, 0);
});
