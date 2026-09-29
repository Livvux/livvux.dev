# Cloudflare cf CLI article: source and validation notes

Checked on 2026-09-29. Article slug: `cloudflare-cf-cli`.

## Primary sources

| Source | Evidence used |
| --- | --- |
| [Launch announcement](https://blog.cloudflare.com/cloudflare-cf-cli-launch/) | Release context, attributed operation counts, roadmap and Wrangler maintenance boundary. These are vendor statements, not independent measurements. |
| [Official repository](https://github.com/cloudflare/cf) | Open-source status and TypeScript configuration direction. |
| [CLI README](https://github.com/cloudflare/cf/blob/main/packages/cli/README.md) | npm package, Node.js requirement, credential precedence, project initialization, development/deployment, structured output exceptions and supported local resources. |
| [Login alias](https://github.com/cloudflare/cf/blob/main/packages/cli/src/commands/login/index.ts) | `cf login` delegates to `cf auth login`; readers should not run both in sequence. |
| [Migration command](https://github.com/cloudflare/cf/blob/main/packages/cli/src/commands/migrate/index.ts) | `--dry-run`, dirty-worktree override and Vite/Wrangler bundler selection. |
| [Migration runner](https://github.com/cloudflare/cf/blob/main/packages/cli/src/lib/wrangler-migration.ts) | Required follow-ups, changed-file output and nonzero exit on `needs-intervention`. |
| [CLI entry point](https://github.com/cloudflare/cf/blob/main/packages/cli/src/index.ts) | `cf cli search` discovery guidance, subsequent command help and anonymous-query requirements. |

The package documentation and implementation were read independently of the launch article. Installation and command examples follow those public sources. Repository links follow upstream `main`; subsequent beta changes may require an article update.

## Editorial boundaries

This is a source-based guide, not a hands-on deployment benchmark. No Cloudflare account was authenticated or modified. No Cloudflare API token was requested, recorded or used. No live DNS changes, migration or deployment were performed for the article.

The clean-branch migration sequence, untracked-file review and explicit approval prompt are editorial recommendations. The prompt is not presented as an access-control feature of cf. Structured API output is distinguished from text/binary responses; local support is not claimed for every command. Configuration type checking is not represented as operational authorization.

No generated images or invented terminal screenshots are included. Existing Quick Tunnels and open-source posts are linked rather than duplicated. Both translations preserve the same commands, source set and section structure.

## Validation

Run the dependency-free content checks:

```bash
node --test tests/cloudflare-cf-article.test.mjs
```

The dedicated pull-request workflow installs the repository's locked dependencies, builds the actual Next.js site to compile MDX, then executes the same test file with `ARTICLE_BASE_URL=http://localhost:3000`. The conditional tests request both real production routes and check their titles, canonical links, translation navigation and rendered article content.

The source checks do not substitute for an MDX compile or a production build. They do not revalidate upstream command behavior. A local full-site build was not run during authoring because repository dependencies were unavailable in the authoring runtime. Consult the pull request's actual workflow result before treating build validation as passed.
