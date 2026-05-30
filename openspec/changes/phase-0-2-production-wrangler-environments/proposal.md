## Why

The current Wrangler configuration keeps local development defaults at the top level, including `AUTH_MODE=development` and placeholder Cloudflare resource IDs. This is useful for `wrangler dev`, but it is unsafe as the default deployment path because a plain deploy could target development auth or placeholder resources.

## What Changes

- Add an explicit Wrangler production environment for Cloudflare deploys.
- Keep top-level Wrangler settings scoped to local development.
- Add production-specific deploy and migration commands that require `--env production`.
- Update deployment documentation so operators configure production D1/KV IDs and `SETUP_TOKEN` without committing secrets.
- Non-goals:
  - No new authentication adapter.
  - No Cloudflare Access or OIDC implementation.
  - No change to D1 schema, KV cache semantics, or application API behavior.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `phase-0-project-foundation`: Clarify that deployment configuration must separate local development defaults from production Cloudflare deploy settings.

## Impact

- `apps/worker/wrangler.jsonc`
- Root and Worker package scripts for deploy and remote migrations
- Deployment documentation
- OpenSpec Phase 0 foundation requirements
