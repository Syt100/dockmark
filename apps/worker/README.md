# Dockmark Worker

Hono API running on Cloudflare Workers. This package owns the Worker entrypoint, Cloudflare bindings, D1/KV access, authentication adapters, and Worker tests.

## Development

```sh
corepack pnpm --filter @dockmark/worker dev
```

The root `pnpm dev` command is usually preferred because it also starts the Web UI with the local API proxy.

## Migrations

```sh
corepack pnpm --filter @dockmark/worker db:migrate:local
corepack pnpm --filter @dockmark/worker db:migrate:production
```

Production migrations use the Wrangler `production` environment and reference the D1 binding name `DB`.

## Validation

```sh
corepack pnpm --filter @dockmark/worker typecheck
corepack pnpm --filter @dockmark/worker test
corepack pnpm --filter @dockmark/worker test:unit
corepack pnpm --filter @dockmark/worker test:integration
corepack pnpm --filter @dockmark/worker lint
```

`test` runs both the fast Hono/module tests and the runtime-backed Workers integration tests. The integration suite uses `@cloudflare/vitest-pool-workers`, applies committed D1 migrations, and exercises D1/KV behavior through Miniflare.

## Deployment

```sh
corepack pnpm --filter @dockmark/worker deploy
```

The deploy script targets the Wrangler `production` environment. Run `corepack pnpm --filter @dockmark/worker deploy:dry-run` to inspect bindings before uploading.

## Cloudflare Types

Generate Worker binding types from the Wrangler configuration:

```sh
corepack pnpm --filter @dockmark/worker cf-typegen
corepack pnpm --filter @dockmark/worker cf-typecheck
```

`cf-typecheck` verifies the generated binding declaration is up to date with `wrangler.jsonc`.

Application code derives its Worker binding type from the Wrangler-generated `CloudflareBindings` declaration and adds only application-level optional vars in `src/lib/env.ts`.
