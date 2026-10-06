import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const slug = 'openbot-openmaus-openai-dots-opendots';
const read = (path) => readFileSync(new URL(path, root), 'utf8');
const articles = {
  en: read(`content/${slug}/en.mdx`),
  de: read(`content/${slug}/de.mdx`),
};

const parse = (text) => {
  const match = text.match(/^---\n([\s\S]+?)\n---\n([\s\S]+)$/);
  assert.ok(match, 'frontmatter and body are required');
  const fields = Object.fromEntries(
    [...match[1].matchAll(/^(\w+): "([^"\n]+)"$/gm)].map((field) => [field[1], field[2]]),
  );
  return { fields, body: match[2] };
};

const links = (text) => [...text.matchAll(/\]\(([^)]+)\)/g)].map((match) => match[1]);

for (const [lang, article] of Object.entries(articles)) {
  const { fields, body } = parse(article);

  test(`${lang}: metadata and complete comparison`, () => {
    assert.equal(fields.publishedAt, '2026-10-06');
    assert.equal(fields.author, 'Livvux');
    assert.ok(fields.title.includes('OpenBot'));
    assert.ok(fields.title.includes('OpenMaus'));
    assert.ok(fields.title.includes('OpenDots'));
    assert.ok(fields.summary.length >= 120 && fields.summary.length <= 240);
    assert.ok(body.split(/\s+/).length >= 2200, 'full bilingual comparison expected');
    assert.doesNotMatch(body, /^# /m, 'page supplies the h1');
    assert.doesNotMatch(body, /utm_source||<script|<iframe|dangerouslySetInnerHTML/i);
  });

  test(`${lang}: licensing distinctions remain explicit`, () => {
    assert.match(body, /PolyForm Noncommercial 1\.0\.0/);
    assert.match(body, /Apache(?: License)? 2\.0|Apache-2\.0/);
    assert.match(body, /\bMIT\b/);
    assert.match(body, /source-available/i);
    assert.match(body, /enterprise\//);
    assert.match(
      body,
      lang === 'de'
        ? /OpenAI Dots ist proprietär|Dots ist.*proprietär/is
        : /OpenAI Dots is proprietary|Dots is.*proprietary/is,
    );
  });

  test(`${lang}: time-sensitive facts remain current to the research note`, () => {
    assert.match(body, /\$89\/month|\$89\/Monat/);
    assert.match(body, /\$125\/month|\$125\/Monat/);
    assert.match(body, /European Economic Area|Europäischen Wirtschaftsraum/);
    assert.match(body, /danger-full-access/);
    assert.match(body, /Workspace only/);
    assert.match(body, /GPT-6 Astra/);
    assert.match(body, /not a security-audited autonomous agent|nicht um einen sicherheitsauditierten autonomen Agenten/);
  });

  test(`${lang}: winners cover all four products without claiming an intelligence benchmark`, () => {
    for (const product of ['OpenBot', 'OpenMaus', 'OpenAI Dots', 'OpenDots']) {
      assert.ok(body.includes(product), product);
    }
    assert.match(body, lang === 'de' ? /keinen Sieger|bewusst keinen Sieger/ : /not giving this category a winner/);
    assert.match(body, lang === 'de' ? /kein kontrollierter.*Praxistest/is : /not a controlled.*benchmark/is);
  });

  test(`${lang}: primary links and locale-correct internal link`, () => {
    const targets = links(body);
    const internal = targets.filter((target) => target.startsWith('/'));
    assert.deepEqual(internal, [`/blog/code-must-be-free${lang === 'de' ? '/de' : ''}`]);

    for (const target of targets.filter((value) => !value.startsWith('/'))) {
      const url = new URL(target);
      assert.equal(url.protocol, 'https:');
      assert.equal(url.search, '');
    }

    for (const required of [
      'https://github.com/nightly-labs/openbot',
      'https://github.com/milind-soni/OpenMausBot',
      'https://github.com/CopilotKit/OpenDots',
      'https://help.openai.com/en/articles/20001530-getting-started-with-your-dot',
      'https://openai.com/business/pricing/',
      'https://www.openmausbot.com/pricing',
      'https://www.copilotkit.ai/pricing',
    ]) {
      assert.ok(targets.includes(required), required);
    }
  });
}

test('English and German versions cite the same external evidence', () => {
  const external = (text) =>
    [...new Set(links(text).filter((target) => !target.startsWith('/')))].sort();
  assert.deepEqual(external(articles.en), external(articles.de));
});

test('comparison source note exists and records the four licensing models', () => {
  const sources = read('docs/openbot-openmaus-dots-comparison-sources.md');
  for (const term of ['PolyForm Noncommercial', 'Apache-2.0', 'MIT', 'proprietary']) {
    assert.match(sources, new RegExp(term, 'i'));
  }
  assert.match(sources, /OpenMaus price data uses the current October 2026 pricing page/);
});
