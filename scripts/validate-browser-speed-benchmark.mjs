import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// No browser, network connection or third-party dependency is needed.
// This validates the publication, not the original benchmark's execution.
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const prefix = "/benchmarks/browser-speed-2026-09-22/";
const archive = resolve(root, `public${prefix}`);
const hashes = {
  "browser-speed-report.json": "542e265d077c429a04569c3baefc80549bda1ceaaf81557952e488daf5e60e47",
  "browser-speed-report.csv": "100d95b32b190a3c6a44a337e94930fefe3a726939c4b67533a5ed4c95f61bcb",
  "browser-speed-report.md": "229c95e7513afe97c635d5817bb956057bd5eef4c4d69c337642efeca889a313",
};

for (const [name, expected] of Object.entries(hashes)) {
  const actual = createHash("sha256").update(readFileSync(resolve(archive, name))).digest("hex");
  assert.equal(actual, expected, `${name}: uploaded source bytes changed`);
}

const data = JSON.parse(readFileSync(resolve(archive, "browser-speed-report.json"), "utf8"));
assert.equal(data.meta.date, "2026-09-22");
assert.deepEqual(data.meta.tool_versions, { obscura: "0.2.3", "agent-browser": "0.38.1" });
const entries = Object.entries(data.results);
assert.equal(entries.length, 20);

// Explicit mapping avoids assumptions about the two exports' different names.
const csvKeys = [
  ["cold_local", "obscura", "cold_local_obscura"],
  ["cold_local", "agent-browser", "cold_local_agent_browser"],
  ["warm_seq5", "obscura", "warm_seq5_obscura"],
  ["warm_seq5", "agent-browser", "warm_seq5_agent_browser"],
  ["batch5_scrape", "obscura", "batch5_obscura_scrape"],
  ["batch5", "agent-browser", "batch5_agent_browser"],
  ["screenshot", "obscura", "screenshot_obscura"],
  ["screenshot", "agent-browser", "screenshot_agent_browser"],
  ["cold_remote", "obscura", "cold_remote_obscura"],
  ["cold_remote", "agent-browser", "cold_remote_agent_browser"],
  ["warm_remote3", "obscura", "warm_remote3_obscura"],
  ["warm_remote3", "agent-browser", "warm_remote3_agent_browser"],
  ["cold_remote_stealth", "obscura", "cold_remote_stealth_obscura"],
  ["warm_remote3_stealth", "obscura", "warm_remote3_stealth_obscura"],
  ["batch3_remote_stealth", "obscura", "batch3_remote_stealth_obscura"],
  ["cold_local_stealth", "obscura", "cold_local_stealth_obscura"],
  ["interactive5", "agent-browser", "interactive5_agent_browser"],
  ["interactive5_cdp", "obscura", "interactive5_obscura_cdp"],
  ["interactive5_fetch_eval", "obscura", "interactive5_obscura_fetch_eval"],
  ["serve_cold_start", "obscura", "serve_cold_start_obscura"],
];
const [header, ...lines] = readFileSync(resolve(archive, "browser-speed-report.csv"), "utf8").trim().split(/\r?\n/);
assert.equal(header, "scenario,tool,n,median_ms,min_ms,max_ms,runs_ms");
assert.equal(lines.length, csvKeys.length);
// The archived CSV has no quoted fields; source hashing enforces that format.
lines.forEach((line, index) => {
  const [scenario, tool, n, median, min, max, runs] = line.split(",");
  const [expectedScenario, expectedTool, key] = csvKeys[index];
  assert.equal(scenario, expectedScenario);
  assert.equal(tool, expectedTool);
  assert.deepEqual(
    { n: Number(n), median_ms: Number(median), min_ms: Number(min), max_ms: Number(max), runs_ms: runs.split(" ").map(Number) },
    data.results[key],
    `${key}: JSON/CSV mismatch`,
  );
});

for (const [key, row] of entries) {
  assert.equal(row.n, row.runs_ms.length, `${key}: sample count`);
  assert.ok(row.n >= 4 && row.n <= 7);
  assert.ok(row.runs_ms.every((value) => Number.isFinite(value) && value > 0));
  const sorted = [...row.runs_ms].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  // Individual runs are rounded to 0.1 ms. Keep the published medians intact.
  assert.ok(Math.abs(median - row.median_ms) <= 0.051, `${key}: median outside rounding tolerance`);
  assert.equal(row.min_ms, sorted[0], `${key}: minimum`);
  assert.equal(row.max_ms, sorted.at(-1), `${key}: maximum`);
}
assert.deepEqual(data.results.batch5_agent_browser, data.results.warm_seq5_agent_browser);

for (const language of ["en", "de"]) {
  const path = resolve(root, "content/obscura-vs-agent-browser-benchmark", `${language}.mdx`);
  const text = readFileSync(path, "utf8");
  const frontmatter = text.match(/^---\n([\s\S]*?)\n---\n/);
  assert.ok(frontmatter, `${language}: frontmatter missing`);
  for (const key of ["title", "publishedAt", "author", "summary"]) {
    assert.match(frontmatter[1], new RegExp(`^${key}: "[^"\\n]+"$`, "m"));
  }
  assert.match(frontmatter[1], /^publishedAt: "2026-09-22"$/m);
  assert.equal((text.match(/^```/gm) ?? []).length, 4, `${language}: code fences`);
  assert.ok(text.includes("export AGENT_BROWSER_SESSION=bench-speed"));
  for (const [, row] of entries) {
    const number = row.median_ms.toFixed(1).replace(".", language === "de" ? "," : ".");
    assert.ok(text.includes(number), `${language}: missing median ${number}`);
  }
  const downloadPaths = [...text.matchAll(/\]\((\/benchmarks\/[^)]+)\)/g)].map((match) => match[1]);
  for (const name of Object.keys(hashes)) {
    assert.ok(downloadPaths.includes(`${prefix}${name}`), `${language}: missing ${name} link`);
  }
  for (const href of downloadPaths) {
    assert.ok(href.startsWith(prefix), `${language}: unexpected benchmark link`);
    assert.ok(existsSync(resolve(root, `public${href}`)), `${language}: broken link ${href}`);
  }
  const related = `/blog/code-must-be-free${language === "de" ? "/de" : ""}`;
  assert.ok(text.includes(`](${related})`), `${language}: localized related article`);
}

console.log("PASS: 3 byte-identical sources; 20 JSON/CSV rows; timing summaries; both articles' metadata, median coverage, code fences and download links.");
console.log("Scope: source-level validation only. No benchmark rerun, MDX compilation, Next.js build or browser-rendering test.");
