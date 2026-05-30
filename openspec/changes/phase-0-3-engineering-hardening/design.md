## Context

Dockmark currently has a working Cloudflare Worker with Hono routes, D1-backed service navigation and built-in authentication, KV-backed navigation cache, and Vue clients. The implementation is appropriate for early Phase 1, but several details are still brittle:

- API errors are represented as response text and localized through frontend substring matching.
- Worker bindings are typed manually while Wrangler also generates binding declarations.
- Worker tests use a hand-written D1/KV mock that approximates SQL behavior.
- Service navigation writes and cache invalidation are split between route handlers and DB helpers.
- KV cache version increment is read-modify-write and can lose concurrent invalidations.
- Built-in auth touches session state on every authenticated request.

This change keeps the product behavior stable while tightening contracts and runtime correctness before later phases add import/export, bookmark import, browser extension sync, and additional authentication adapters.

## Goals / Non-Goals

**Goals:**

- Provide one stable structured API error shape for Worker responses and web client handling.
- Use generated Wrangler binding types as the primary binding contract.
- Add runtime-backed Worker integration tests for behavior that handwritten mocks can miss.
- Centralize service navigation mutations and cache invalidation in application service functions.
- Make navigation cache invalidation deterministic enough for concurrent writes without treating KV as source of truth.
- Reduce D1 write amplification from session touch updates.

**Non-Goals:**

- No new end-user feature, page, import/export behavior, browser extension sync, or bookmark sync.
- No implementation of OIDC or Cloudflare Access JWT validation.
- No new secret storage behavior and no storage of Homelab service credentials.
- No destructive migration or large data model rewrite.
- No replacement of Hono, D1, KV, Vue, or pnpm workspace structure.

## Decisions

### Use a shared structured API error envelope

Return failures as a shared response shape such as:

```ts
type ApiErrorResponse = {
  error: {
    code: string
    message: string
    fields?: Record<string, string[]>
    requestId?: string
  }
}
```

The Worker will map validation failures, auth failures, not-found cases, conflict cases, and internal errors to stable `code` values. The web client will prefer `error.code` for localization and preserve `message` as fallback.

Alternative considered: keep text responses and expand substring maps. This is low effort but makes frontend behavior depend on fragile implementation wording and D1 error strings.

### Treat Wrangler-generated bindings as source of truth

The Worker should consume generated binding declarations from `wrangler types` and add only application-specific narrowing where necessary. Reserved auth mode strings may remain documented, but code should not maintain an independent binding interface that can drift from `wrangler.jsonc`.

Alternative considered: keep manual `Bindings` and occasionally run `cf-typecheck`. This does not prevent stale manual bindings from being trusted by application code.

### Add runtime-backed Worker integration tests without deleting fast unit tests

Use Cloudflare's Workers Vitest integration or equivalent Miniflare-backed setup for tests that need real Worker request handling, D1 SQL semantics, KV semantics, cookie behavior, and migrations. Keep small unit tests for pure shared validation and isolated helpers.

Alternative considered: expand the existing in-memory SQL mock. That increases maintenance cost and still cannot reliably model D1 constraints, migrations, and runtime bindings.

### Move navigation mutations behind service functions

Introduce application service functions for category, tag, and item mutations. Routes should parse/authorize requests and call a service; the service should perform D1 writes and cache invalidation as one application-level operation.

Alternative considered: keep invalidation in every route handler. That is easy to forget as new write paths appear, especially import/export and sync.

### Store navigation cache version in D1 or otherwise invalidate deterministically

D1 is the source of truth, so cache version state should either live in D1 or be derivable from D1 mutation state. KV entries remain disposable response cache. The implementation may continue writing response payloads to KV, but concurrent mutations must not depend on a lossy KV read-modify-write increment.

Alternative considered: add TTL only. TTL reduces stale duration but does not give deterministic invalidation after writes.

### Throttle session touch updates

Built-in auth should not update `last_seen_at` on every protected request. Update at most once per configured window or when the stored timestamp is older than a threshold. This keeps current session semantics while reducing D1 writes.

Alternative considered: move every touch into `waitUntil`. That reduces request latency but still writes for every request.

## Risks / Trade-offs

- [Risk] Structured errors require coordinated Worker and web changes. -> Mitigation: introduce the shared type first and keep fallback parsing during migration.
- [Risk] Runtime-backed tests may be slower than current mock tests. -> Mitigation: keep pure tests fast and limit runtime tests to contract and integration behavior.
- [Risk] Binding type generation can add local workflow friction. -> Mitigation: document `cf-typegen/cf-typecheck` and wire them into validation only when deterministic in CI.
- [Risk] D1-backed cache version adds a small DB read/write cost. -> Mitigation: keep payload caching in KV and use D1 only for compact invalidation metadata tied to writes.
- [Risk] Refactoring write paths can accidentally alter API behavior. -> Mitigation: add regression tests around create/update/delete, cache headers, and auth failures before changing internals.

## Migration Plan

1. Add shared error types and Worker error mapping while preserving existing status codes.
2. Update the web API client to parse structured errors with text fallback.
3. Align Worker binding types with Wrangler-generated declarations and validate type generation.
4. Add runtime-backed integration tests for current behavior.
5. Refactor navigation write paths into service functions and prove cache invalidation with tests.
6. Replace lossy KV version increments with deterministic invalidation metadata.
7. Add throttled session touch behavior and regression tests.

Rollback is code-only unless a D1 metadata table/key is introduced for cache versioning. If a migration is needed, it must be additive and safe to leave unused during rollback.

## Open Questions

- Should cache version metadata reuse `app_metadata` or use a dedicated `cache_metadata` table?
- Should structured errors include a request ID immediately, or reserve the field until structured logging is added?
