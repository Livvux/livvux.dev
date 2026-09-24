# Pfotenweb self-hosting article: source and verification notes

Reviewed on 2026-09-24. Article slug: `pfotenweb-self-hosting`.

## Scope

Two complete, plain-language articles use the existing `content/<slug>/en.mdx`
and `de.mdx` convention. English is `/blog/pfotenweb-self-hosting`; German is
`/blog/pfotenweb-self-hosting/de`. No runtime component, package or application
behaviour changes are needed. Each translation has one discreet hosted-service
link and an explicit author-ownership disclosure. The private cloud repository
was not used or published.

## Version boundary

The GitHub latest-release response identified `v1.0.1`, published
2026-09-09T08:13:03Z. Installation and UI instructions were checked against that
release, not against unreleased changes on `main`.

- Release: https://github.com/Livvux/pfotenweb/releases/tag/v1.0.1
- Release README: https://github.com/Livvux/pfotenweb/blob/v1.0.1/README.md
- Compose: https://github.com/Livvux/pfotenweb/blob/v1.0.1/compose.yaml
- Build: https://github.com/Livvux/pfotenweb/blob/v1.0.1/Dockerfile
- Build exclusions: https://github.com/Livvux/pfotenweb/blob/v1.0.1/.dockerignore
- Configuration: https://github.com/Livvux/pfotenweb/blob/v1.0.1/.env.example
- First-run setup: https://github.com/Livvux/pfotenweb/blob/v1.0.1/scripts/setup.ts
- Import boundary: https://github.com/Livvux/pfotenweb/blob/main/README.md

`v1.0.1` reads archive format 1. Newer import support in development is not
presented as a published update. Its additional `import_archives` volume is not
part of this release's Compose file or the article's backup command.

## What was verified in the source

- One organisation per install; MIT licence; no software subscription, animal
  limit or cloud-account requirement. Hosting and storage remain separate costs.
- The existing Compose recipe includes PostgreSQL, the setup task, app and
  optional Caddy HTTPS profile. PostgreSQL is not publicly published, and the
  app binds to host loopback. Database URLs are overridden by Compose.
- The initial administrator password requires 16–200 characters, username
  3–50, organisation name 2–60. Later setup runs preserve existing accounts.
- Actual German UI labels, routes, animal status options, publication controls,
  team roles and enquiry handling were read, not inferred from a cloud demo.
- Animal creation is not described as saving a private draft. News has an
  explicit publication checkbox. Enquiries can be answered through mailto in
  the user's mail application; no in-app reply-thread feature is promised.
- SMTP is optional. Enquiries remain in the administrator area without it.
- Backups include the database, uploads and private deployment settings. The
  manual example does not create an automatic schedule or prove restoration.
- The reviewed release tree contains no ready-made Pfotenweb one-click deploy
  template. No untested Coolify/Dokploy/Render/Railway button is invented.

UI sources:

- https://github.com/Livvux/pfotenweb/tree/v1.0.1/src/app/admin
- https://github.com/Livvux/pfotenweb/blob/v1.0.1/src/components/admin/animal-form.tsx
- https://github.com/Livvux/pfotenweb/blob/v1.0.1/src/components/admin/post-form.tsx
- https://github.com/Livvux/pfotenweb/blob/v1.0.1/src/components/admin/team-forms.tsx
- https://github.com/Livvux/pfotenweb/blob/v1.0.1/src/lib/roles.ts

## External documentation and editorial choices

- https://docs.docker.com/engine/install/ubuntu/
- https://caddyserver.com/docs/automatic-https

The walkthrough deliberately chooses a fresh Ubuntu 24.04 LTS server and the
official Docker apt repository (`noble`), rather than a curl-to-shell convenience
installer. It must not be applied unchanged to another OS or an existing hosting
panel. No paid server is created or recommended by affiliate link.

The 2-vCPU / 4-GB / 40-GB suggestion is an explicitly unbenchmarked editorial
planning estimate, not an upstream minimum or a capacity claim. Automatic HTTPS
still requires correct public DNS and reachable, available ports 80/443.

The backup example writes to `~/pfotenweb-backups`, outside the project and Docker
build context. The released `.dockerignore` does not exclude a `backup` directory;
keeping archives beside the Dockerfile risks including private data in a build.
The example adds a timestamp, restrictive permissions and an EXIT trap to restart
the app. It performs only basic file checks. Off-server encrypted storage
and a separate restoration test remain necessary. No destructive restore command
is offered as a beginner copy-and-paste operation.

## Verification boundaries

Local checks use Node's built-in test runner and `bash -n`; shell examples are
syntax-checked, never executed. The translation test compares all Bash and dotenv
blocks exactly; the explanatory text diagram is translated.

The PR-scoped workflow builds the existing Next.js site, type-checks it and tests
the real local production routes, metadata, footnotes, links and blog index. These
are blog-publication checks, not a Pfotenweb deployment test.

No new production deployment, live DNS change, paid-server purchase, database
migration or restore was performed for this article. The local authoring
environment did not provide Docker or a complete installable blog checkout, so
the full site build is delegated to the PR's GitHub Actions workflow. Its actual
result must be reported from GitHub, not assumed from the workflow definition.
