# Migrations

Dockmark uses Cloudflare D1 SQL migrations committed in this directory.

Apply locally:

```sh
pnpm db:migrate:local
```

Apply remotely after configuring the real D1 database ID:

```sh
pnpm db:migrate:remote
```
