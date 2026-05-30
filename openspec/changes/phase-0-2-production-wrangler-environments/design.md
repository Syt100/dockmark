## Context

Dockmark currently uses one Wrangler configuration file for both local development and production deployment. The top-level config is convenient for local work because it can use local D1/KV simulation and `AUTH_MODE=development`, but it is not a safe production default.

Wrangler supports named environments. Environment-specific `vars` and bindings must be declared explicitly rather than relying on inheritance for deployment-sensitive settings. This fits Dockmark's boundary: local development can remain easy, while production deploys require explicit Cloudflare resources and built-in authentication.

## Decision

Use top-level `wrangler.jsonc` for local development only, and add `env.production` for production deployment.

The top-level config will keep:

- `AUTH_MODE=development`
- local-friendly D1/KV placeholder IDs
- the existing Worker name used by local dev

The production environment will define:

- a production Worker name
- `AUTH_MODE=builtin`
- production D1 and KV bindings with placeholder IDs that must be replaced before deployment
- the same assets and observability behavior inherited or restated as required by Wrangler

Root scripts and Worker scripts will make the safe path explicit:

- local migration/dev commands continue to use local defaults
- remote production migrations use `wrangler d1 migrations apply ... --remote --env production`
- production deploy uses `wrangler deploy --env production --minify`

## Secret Handling

`SETUP_TOKEN` is a secret-like bootstrap value and must not be committed in `wrangler.jsonc`. Operators configure it with Wrangler secret management or equivalent environment-specific secret configuration before first setup.

The committed config may include non-secret defaults such as `AUTH_MODE=builtin`, `APP_VERSION`, session cookie name, TTL, and PBKDF2 iteration count. Real D1/KV IDs are identifiers rather than application secrets, but they should still be environment-specific and intentionally configured.

## Alternatives Considered

### Replace top-level config with production defaults

This would make plain deploy safer, but it would make local development less obvious and increase the chance of accidentally using remote resources during development.

### Split into separate config files

Separate files can work, but they duplicate the Worker entry point, assets, compatibility date, and binding structure. Wrangler environments keep the local and production contract in one schema-validated file.

### Keep docs-only warnings

Warnings are not enough. Scripts should encode the production path so common commands do not rely on remembering several flags.

## Risks

- Production IDs remain placeholders until an operator creates Cloudflare resources.
  Mitigation: deployment docs and checklist require replacing IDs before migration/deploy.
- `SETUP_TOKEN` must be configured out-of-band.
  Mitigation: deployment docs include the Wrangler secret command and setup removal/rotation guidance.
- `env.production` changes Worker names and resource bindings.
  Mitigation: use explicit production scripts so operators can dry-run and inspect bindings before deployment.
