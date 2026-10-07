import { DATA } from "@/data/resume";

export const dynamic = "force-static";

export function GET() {
  const url = (path: string) => new URL(path, DATA.url).href;
  const body = `# ${DATA.name} — livvux.dev

> ${DATA.description}

## Pages
- [Portfolio](${url("/")}): Background, projects and contact links.
- [Blog](${url("/blog")}): Technical articles in English and German.
- [Tools](${url("/tools")}): Developer tools.
- [Crawler information](${url("/tools/crawler")}): How LivvuxBot handles crawl requests.

## Discovery
- [Sitemap](${url("/sitemap.xml")}): Published page URLs and available translations.
- [Robots.txt](${url("/robots.txt")}): Crawl preferences.

## Citation Notes
- Cite the canonical article URL, not this guide or an archive page.
- English articles use /blog/<slug>; German translations use /blog/<slug>/de when available.
- Use the author and editorial dates shown on the article. A publication or update date does not imply that every linked source was checked on that date.
`;
  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
