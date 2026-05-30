# Migrations

Dockmark uses Cloudflare D1 SQL migrations committed in this directory.

Apply locally:

```sh
pnpm db:migrate:local
```

Apply to production after configuring the real production D1 database ID:

```sh
pnpm db:migrate:production
```
