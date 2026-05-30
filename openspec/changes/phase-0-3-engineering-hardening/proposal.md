## Why

Dockmark's foundation is functional, but several early implementation shortcuts will become expensive as authentication, import/export, sync, and deployment paths grow. This change hardens the backend/API foundation before later phases depend on unstable contracts or runtime mocks.

## What Changes

- Add a structured API error contract shared by Worker and web clients.
- Make generated Wrangler binding types the source of truth for Worker binding access.
- Add real Worker-runtime integration coverage for D1 migrations, KV cache behavior, auth, and HTTP responses.
- Move multi-step service navigation writes and cache invalidation behind application service boundaries.
- Make navigation cache invalidation deterministic under concurrent writes while keeping D1 as the source of truth and KV as rebuildable cache.
- Reduce per-request auth write amplification by bounding non-critical session touch updates.
- Keep the change backend/foundation-focused; no product workflow, bookmark sync, import/export, or new auth provider behavior changes.

## Capabilities

### New Capabilities

- `phase-0.3-engineering-hardening`: Defines backend contract, Worker runtime, cache invalidation, and service-boundary hardening requirements for the project foundation.

### Modified Capabilities

- None.

## Non-goals

- No browser extension sync, bookmark sync, import/export, or R2 asset storage changes.
- No implementation of OIDC, Cloudflare Access JWT validation, multi-user roles, sharing, or per-client sync tokens.
- No storage of Homelab service passwords, API keys, tokens, OTP seeds, session cookies, or other service secrets.
- No destructive D1 migration or production data model rewrite.
- No frontend visual redesign beyond adapting to structured error responses if needed.

## Impact

- Affected code: `apps/worker` API routes, error handling, environment typing, auth/session touch behavior, navigation write paths, and tests.
- Affected code: `packages/shared` API contract types and validation helpers.
- Affected code: `apps/web` API client and error mapping where structured errors replace text matching.
- Test impact: add Worker-runtime integration tests while retaining focused unit tests.
- Operational impact: validation should include generated binding type checks and runtime-backed Worker tests.
