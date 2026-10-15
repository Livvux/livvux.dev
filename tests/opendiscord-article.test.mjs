import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import test from "node:test";

const root = new URL("../", import.meta.url);
const slug = "opendiscord-open-source-discord-alternative";
const video = new URL("public/videos/opendiscord-introduction.mp4", root);
const cover = new URL("public/images/blog/opendiscord/cover.webp", root);
const read = (path) => readFileSync(new URL(path, root), "utf8");

for (const lang of ["en", "de"]) {
  test('openDiscord ' + lang + ': metadata, media and sourcing', () => {
    const content = read('content/' + slug + '/' + lang + '.mdx');
    assert.match(content, /^---\n[\s\S]+?\n---\n/);
    for (const key of ["title", "publishedAt", "author", "summary", "image"]) {
      assert.match(content, new RegExp('^' + key + ': "[^"\\n]+"$', "m"));
    }
    assert.match(content, /^publishedAt: "2026-10-15"$/m);
    assert.match(content, /^author: "Livvux"$/m);
    assert.match(content, /^image: "\/images\/blog\/opendiscord\/cover\.webp"$/m);
    assert.match(content, /<video controls playsInline preload="none"/);
    assert.match(content, /<source src="\/videos\/opendiscord-introduction\.mp4" type="video\/mp4"/);
    assert.match(content, /poster="\/images\/blog\/opendiscord\/cover\.webp"/);
    assert.match(content, /https:\/\/github\.com\/Livvux\/openDiscord\/blob\/main\/docs\/ROADMAP\.md/);
    assert.match(content, /https:\/\/github\.com\/Livvux\/openDiscord\/blob\/main\/docs\/PRIVACY\.md/);
    assert.match(content, /https:\/\/opendiscord\.app\//);
    assert.doesNotMatch(content, /^# /m, "The page already supplies the H1");
    assert.doesNotMatch(content, /sandbox:|<script|dangerouslySetInnerHTML/);
  });
}

test("openDiscord: optimized native media assets are committed", () => {
  assert.ok(existsSync(video));
  assert.ok(existsSync(cover));
  const videoBytes = readFileSync(video);
  assert.equal(videoBytes.toString("ascii", 4, 8), "ftyp");
  assert.ok(videoBytes.length > 100_000);
  assert.ok(videoBytes.length < 10_000_000, "Avoid embedding a huge unoptimized video");
  const coverBytes = readFileSync(cover);
  assert.equal(coverBytes.toString("ascii", 0, 4), "RIFF");
  assert.equal(coverBytes.toString("ascii", 8, 12), "WEBP");
  assert.ok(statSync(cover).size < 250_000);
});

test("openDiscord: website's project card links to the article", () => {
  const resume = read("src/data/resume.tsx");
  assert.match(resume, /title: "openDiscord"/);
  assert.match(resume, /href: "\/blog\/opendiscord-open-source-discord-alternative"/);
  assert.match(resume, /image: "\/images\/blog\/opendiscord\/cover\.webp"/);
});

test("openDiscord: both translations disclose the alpha and privacy limits", () => {
  const en = read('content/' + slug + '/en.mdx');
  const de = read('content/' + slug + '/de.mdx');
  assert.match(en, /closed alpha/i);
  assert.match(de, /Closed Alpha/);
  assert.match(en, /not an end-to-end encrypted/i);
  assert.match(de, /kein Ende-zu-Ende-verschlüsselter/i);
  assert.match(en, /no independent security audit/i);
  assert.match(de, /unabhängiges Sicherheitsaudit/i);
  assert.match(en, /member accounts and attachments are not included/i);
  assert.match(de, /Benutzerkonten und Anhänge werden nicht mit übertragen/i);
});
