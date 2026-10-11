import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import test from "node:test";
import ts from "typescript";

const fixturePath = process.env.UMAMI_FIXTURE_SCRIPT;
const ownId = "a1111111-1111-4111-8111-111111111111";
const oldId = "b2222222-2222-4222-8222-222222222222";
const source = readFileSync(new URL("../src/lib/umami.ts", import.meta.url), "utf8");

function fixture() {
  const sdk = readFileSync(fixturePath, "utf8"), scripts = [], requests = [];
  function script(id = "") {
    return { dataset: { websiteId: id, autoTrack: "false", domains: "livvux.dev" },
      src: "https://rpcrate.com/_sr/s.js", events: {},
      addEventListener(name, fn) { this.events[name] = fn; },
      getAttribute(name) { return this.dataset[name.replace(/^data-/, "").replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())] ?? null; },
    };
  }
  const document = { currentScript: null, referrer: "", title: "Portfolio", readyState: "complete", visibilityState: "visible",
    createElement: () => script(), head: { append: (value) => scripts.push(value) },
    querySelector: () => scripts.find((value) => value.dataset.websiteId) ?? null,
    querySelectorAll: () => scripts.filter((value) => value.dataset.websiteId),
    addEventListener() {}, removeEventListener() {},
  };
  const window = { document, screen: { width: 1280, height: 720 }, location: new URL("https://livvux.dev/"), navigator: { language: "en" },
    history: { pushState() {}, replaceState() {} }, localStorage: { getItem: () => null }, addEventListener() {},
  };
  window.top = window;
  const context = { window, document, URL, setTimeout, fetch: async (url, options) => {
    requests.push({ url, headers: options.headers, body: JSON.parse(options.body) });
    return { json: async () => ({ cache: "local-fixture-cache" }) };
  } };
  const loaded = { exports: {} };
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  new Function("module", "exports", "window", "document", "navigator", compiled)(loaded, loaded.exports, window, document, window.navigator);
  return { api: loaded.exports, window, scripts, requests, script,
    evaluateSdk: (value) => { document.currentScript = value; vm.runInNewContext(sdk, context); },
  };
}

const options = { skip: fixturePath ? false : "Set UMAMI_FIXTURE_SCRIPT to the reviewed real offline Umami script; no network fetch." };
test("real SDK: a preexisting closure never receives the new ID or another loader", options, async () => {
  const f = fixture(), old = f.script(oldId);
  f.scripts.push(old); f.evaluateSdk(old);
  assert.equal(f.window.umami.getSession().website, oldId);
  assert.equal(f.api.startUmamiPage(ownId, "/", "Portfolio"), undefined);
  await new Promise(setImmediate);
  assert.equal(f.scripts.length, 1); assert.equal(f.requests.length, 0);
  assert.equal(f.window.umami.getSession().website, oldId);
});

test("real SDK: a late old closure fails the getSession binding check", options, async () => {
  const f = fixture();
  f.api.startUmamiPage(ownId, "/", "Portfolio");
  // Old script has left the DOM but its closure wins before our load completes.
  f.evaluateSdk(f.script(oldId)); f.evaluateSdk(f.scripts[0]);
  f.scripts[0].events.load(); await new Promise(setImmediate);
  assert.equal(f.scripts.length, 1); assert.equal(f.requests.length, 0);
  assert.equal(f.window.umami.getSession().website, oldId);
});

test("real SDK: one owned loader keeps headers, cached closure and payload bound across SPA navigation", options, async () => {
  const f = fixture();
  f.api.startUmamiPage(ownId, "/", "Portfolio");
  f.evaluateSdk(f.scripts[0]); f.scripts[0].events.load(); await new Promise(setImmediate);
  f.window.location = new URL("https://livvux.dev/blog?page=2#reading");
  f.api.startUmamiPage(ownId, "/blog", "Blog", "blog:2"); await new Promise(setImmediate);
  assert.equal(f.scripts.length, 1); assert.equal(f.requests.length, 2);
  for (const request of f.requests) {
    assert.equal(request.url, "https://rpcrate.com/_sr/api/send");
    assert.equal(request.headers["x-umami-website-id"], ownId);
    assert.equal(request.body.payload.website, ownId);
    assert.equal(request.body.payload.referrer, "");
    assert.ok(!/[?#]/.test(request.body.payload.url));
  }
  assert.equal(f.window.umami.getSession().website, ownId);
  assert.equal(f.window.umami.getSession().cache, "local-fixture-cache");
  f.api.startUmamiPage(oldId, "/blog", "Blog", "different-entry"); await new Promise(setImmediate);
  assert.equal(f.scripts.length, 1); assert.equal(f.requests.length, 2);
});
