# Dockmark

Dockmark is a serverless dock for Homelab services and browser bookmarks.

## Development

Prerequisites:

- Node.js 24 or a compatible current Node.js runtime
- pnpm via Corepack: `corepack enable pnpm`
- Cloudflare Wrangler, installed through workspace dependencies

Install dependencies:

```sh
pnpm install
```

If your environment does not expose the `pnpm` shim, use:

```sh
corepack pnpm install
```

Run local Worker development:

```sh
pnpm db:migrate:local
pnpm dev
```

The local D1 database starts empty. Run `pnpm db:migrate:local` after pulling new migrations, otherwise API routes such as `/api/nav` will fail with missing-table errors.

Run validation:

```sh
pnpm validate
openspec validate --specs --strict --no-interactive
```

For slow registry access, use the configured npm mirror or run pnpm with a local proxy, for example:

```sh
corepack pnpm install
```

## Structure

- `apps/web`: Vue 3, Vite, Vue Router, Tailwind CSS web UI.
- `apps/worker`: Hono API on Cloudflare Workers.
- `apps/extension`: browser extension placeholder for later phases.
- `packages/shared`: shared TypeScript contracts and utilities.
- `migrations`: Cloudflare D1 SQL migrations.

## Authentication

The Worker uses an auth adapter boundary. Cloudflare Access is the first production adapter, while local development uses an explicit development adapter. Business logic consumes normalized user context instead of raw provider headers.
