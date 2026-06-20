## Why

Dockmark's validation gate should be safe to run in CI or locally without rewriting files, and API conflict responses should not expose D1 table or column details to clients. Tightening both keeps Phase 0.3 engineering hardening useful as later phases build on the same API and workflow.

## What Changes

- Make the root validation path use non-mutating lint checks.
- Keep explicit fix/format commands available for developer-initiated rewrites.
- Return stable structured `conflict` errors for D1 uniqueness failures without exposing raw database messages.
- Execute navigation mutations and cache version invalidation in one D1 consistency boundary.
- Make Worker production observability and release checks explicit in config and deployment docs.
- Centralize web JSON request serialization so API wrappers do not repeat low-level fetch details.
- Add a workspace clean command for ignored build outputs and local caches.
- Add regression coverage for the conflict response contract and lint check behavior.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `phase-0.3-engineering-hardening`: API error responses and validation workflow hardening are tightened without expanding product scope.

## Impact

- Root and web package scripts for validation/lint behavior.
- Worker API error mapping and tests.
- Worker service mutation boundary for categories, tags, and service items.
- Worker Wrangler observability configuration and deployment documentation.
- Web API client request helper and tests.
- Root package scripts and README development workflow.
- No data model, migration, auth, sync, import/export, or credential storage changes.
