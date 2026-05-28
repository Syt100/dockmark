# Migrations

Dockmark uses Cloudflare D1 SQL migrations committed in this directory.

Apply locally:

```sh
pnpm --filter @dockmark/worker wrangler d1 migrations apply dockmark --local
```

Apply remotely after configuring the real D1 database ID:

```sh
pnpm --filter @dockmark/worker wrangler d1 migrations apply dockmark --remote
```

