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

Run local development:

```sh
pnpm db:migrate:local
pnpm db:seed:local
pnpm dev
```

`pnpm dev` starts Vite on port `8788` and the Worker API on port `8789`. Open `http://127.0.0.1:8788`; Vite proxies `/api/*` to the Worker so frontend changes are hot-reloaded without rebuilding `apps/web/dist`.

The local D1 database starts empty. Run `pnpm db:migrate:local` after pulling new migrations, otherwise API routes such as `/api/nav` will fail with missing-table errors. `pnpm db:seed:local` loads reusable local sample categories, services, endpoints, and tags from `seeds/local-dev.sql`; it only targets the local D1 database.

If you specifically need to test the Worker serving the production-built frontend assets, run:

```sh
pnpm build
pnpm dev:worker
```

Run validation:

```sh
pnpm validate
openspec validate --all --strict --no-interactive
```

`pnpm validate` is a read-only gate: it typechecks, tests, lint-checks, format-checks, and builds without applying formatter or lint fixer changes. Use `pnpm format` or `pnpm lint:fix` when you explicitly want local files rewritten.

Clean ignored workspace build outputs and caches:

```sh
pnpm clean
```

Production deploys use the Wrangler `production` environment. Wrangler can automatically provision the production D1 database and KV namespace from the binding configuration:

```sh
pnpm db:migrate:production
pnpm deploy:production
```

Before running those commands, configure `SETUP_TOKEN` as a Wrangler secret.

## Structure

- `apps/web`: Vue 3, Vite, Vue Router, Tailwind CSS web UI.
- `apps/worker`: Hono API on Cloudflare Workers.
- `apps/extension`: Manifest V3 browser extension foundation for later sync phases.
- `packages/shared`: shared TypeScript contracts and utilities.
- `migrations`: Cloudflare D1 SQL migrations.
- `docs`: design notes, project standards, API conventions, and deployment guidance.

## Project Standards

- [项目规范](docs/project-standards.md)
- [代码规范](docs/code-conventions.md)
- [API 约定](docs/api-conventions.md)
- [部署与运维规范](docs/deployment.md)

## Authentication

The Worker uses an auth adapter boundary. Production deployments should use the built-in administrator login unless another production adapter has been implemented and configured. Local development uses an explicit development adapter. Business logic consumes normalized user context instead of raw provider headers.
