<div align="center">

# livvux.dev

Personal coding portfolio of **Lucas Kleipoedszus** ([@Livvux](https://github.com/Livvux)) — freelance software developer since 2015, based in Karlsruhe, Germany.

**[livvux.dev](https://livvux.dev)**

</div>

## Stack

Built with Next.js, [shadcn/ui](https://ui.shadcn.com/), and [Magic UI](https://magicui.design/). Content (blog posts) lives as MDX in [`content/`](./content) and is compiled with [content-collections](https://content-collections.dev). All site data (name, socials, skills, projects) is configured in a single file: [`src/data/resume.tsx`](./src/data/resume.tsx).

Based on [dillionverma/portfolio](https://github.com/dillionverma/portfolio) (MIT).

## Development

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
pnpm lint     # eslint
pnpm build    # production build
```

## Deployment

Deploys via Dokploy from this private GitHub repository.

## Public page statistics

Umami remains disabled while `UMAMI_WEBSITE_ID` in `src/lib/umami.ts` is empty. Activate it only with this portfolio's verified website ID from the existing account and through the normal review/release process.

Rendered portfolio and published blog page owners opt in to manual pageviews. Automatic tracking is disabled; tools, APIs, private/unknown paths and `/privacy` have no pageview owner. Query strings, fragments and referrer contents are omitted; sensitive URL parameters, DNT/GPC and the existing preview/noindex flag prevent loading. Blog archive pagination counts each rendered page while reporting the public `/blog` path. Keep the privacy notice in `/privacy` consistent with the self-hosted collector.

An existing Umami SDK or website-ID script prevents this integration from adding a loader or sending through an unknown SDK. The owned SDK object and its `getSession().website` must remain bound to this site's ID before every send. A collector SDK with an incompatible API therefore fails closed.

Focused checks: `node --test tests/umami.test.mjs tests/seo.test.mjs tests/sitemap.test.mjs`. With `UMAMI_FIXTURE_SCRIPT` pointing to the reviewed real SDK, `node --test tests/umami-sdk.test.mjs` verifies existing/late SDK conflicts and matching header/payload/cache binding without network. `tests/umami.browser.cjs` uses Playwright and a local fixture-ID build; supply the same `UMAMI_FIXTURE_SCRIPT`. All public-looking URLs are intercepted and application requests are forwarded only to the loopback server. Never deploy the fixture ID.
