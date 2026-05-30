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
corepack pnpm --filter @dockmark/worker db:migrate:remote
```

Remote migrations require `apps/worker/wrangler.jsonc` to point at the intended D1 database.

## Validation

```sh
corepack pnpm --filter @dockmark/worker typecheck
corepack pnpm --filter @dockmark/worker test
corepack pnpm --filter @dockmark/worker lint
```

## Deployment

```sh
corepack pnpm --filter @dockmark/worker deploy
```

## Cloudflare Types

Generate Worker binding types from the Wrangler configuration:

```sh
corepack pnpm --filter @dockmark/worker cf-typegen
```

Pass the `CloudflareBindings` as generics when instantiating `Hono`:

```ts
// src/index.ts
const app = new Hono<{ Bindings: CloudflareBindings }>()
```
