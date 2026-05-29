## Why

Dockmark needs a runnable foundation before product features can be implemented. This change establishes the monorepo, Cloudflare Worker runtime, Vue frontend baseline, authentication abstraction, database migration path, and validation commands that later phases depend on.

## What Changes

- Add a `pnpm` workspace monorepo with separate apps for web, Worker API, extension, shared package code, and migrations.
- Add a Vue 3 + TypeScript + Vite + Vue Router + Tailwind CSS web baseline.
- Add a Cloudflare Worker + Hono API baseline that can run locally and serve built web assets.
- Add Wrangler configuration for Worker entry, assets, D1, and KV, with R2 explicitly optional.
- Add D1 migration infrastructure for future schema changes.
- Add adapter-based web/API authentication so Cloudflare Access is the first supported production mode, but not the only future production mode.
- Add pnpm commands for development, build, typecheck, tests, and validation.

Non-goals:

- Do not implement service navigation CRUD in this change.
- Do not implement bookmark import or browser extension sync in this change.
- Do not require R2.
- Do not build a self-hosted username/password auth system yet.

## Capabilities

### New Capabilities
- `phase-0-project-foundation`: Initial Dockmark project foundation for repository structure, runtime baseline, auth adapter foundation, migrations, and quality gates.

### Modified Capabilities
- None.

## Impact

- Affected directories: `apps/web`, `apps/worker`, `apps/extension`, `packages/shared`, `migrations`, root package/workspace files, Wrangler configuration.
- New dependencies: Vue 3, Vite, Vue Router, Tailwind CSS, Hono, Wrangler, TypeScript tooling, test tooling.
- Future phases depend on this change for typed shared contracts, D1/KV bindings, and normalized authentication context.

