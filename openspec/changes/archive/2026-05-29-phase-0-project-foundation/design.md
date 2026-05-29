## Context

Dockmark is currently a design/spec repository. The first implementation step must create a minimal but coherent application skeleton that matches the agreed technical route: service navigation first, browser sync later, Cloudflare-first deployment, and adapter-based authentication.

## Goals / Non-Goals

**Goals:**
- Use `pnpm` workspaces for a TypeScript monorepo.
- Initialize `apps/web` with Vue 3, Vite, Vue Router, and Tailwind CSS.
- Initialize `apps/worker` with Hono on Cloudflare Workers.
- Keep shared schemas, types, URL helpers, IDs, and crypto helpers in `packages/shared`.
- Configure Wrangler for Worker assets, D1, and KV.
- Provide a D1 migration path.
- Define an auth adapter contract with Cloudflare Access and local development implementations.
- Provide validation commands that can run before committing.

**Non-Goals:**
- No service CRUD or dashboard implementation.
- No bookmarks import, browser extension sync, or R2-backed asset management.
- No full self-hosted auth implementation.
- No durable object, queue, or scheduled job dependency.

## Decisions

- Use `pnpm` workspaces because Dockmark has multiple apps and shared packages, but does not need a heavier monorepo orchestrator at the foundation stage.
- Use Vue 3 + Vite for the web app because it matches the chosen frontend route and produces static assets suitable for Workers Assets.
- Use Tailwind CSS for the web styling baseline so Phase 1 can build a focused operational UI without selecting a heavy component framework.
- Use Hono in the Worker app for routing and middleware composition while keeping Cloudflare bindings directly accessible.
- Use raw D1 migrations committed as SQL files; ORM adoption is deferred until the schema complexity justifies it.
- Use an auth adapter interface returning a normalized user context. The initial production adapter validates Cloudflare Access context. Local development uses an explicit dev adapter.
- Keep R2 optional by avoiding required R2 bindings in the foundation configuration.

## Risks / Trade-offs

- The auth adapter adds a small abstraction before a second auth mode exists, but it prevents Cloudflare Access assumptions from leaking through business logic.
- Raw SQL migrations are transparent and Cloudflare-native, but require discipline around repository functions and tests.
- Tailwind speeds up early UI work, but style consistency still requires shared component conventions in Phase 1.

