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
