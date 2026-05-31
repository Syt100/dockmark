## 1. API Error Contract

- [x] 1.1 Add shared structured API error response types and stable error code definitions.
- [x] 1.2 Update Worker global error handling and route helpers to emit structured errors with existing status codes.
- [x] 1.3 Update validation, auth, conflict, and not-found paths to use stable error codes.
- [x] 1.4 Update the web API client and Chinese error mapping to prefer structured error codes with a temporary text fallback.
- [x] 1.5 Add regression tests for structured validation, auth, not-found, conflict, and internal error responses.

## 2. Worker Binding Types

- [x] 2.1 Refactor Worker environment typing to use Wrangler-generated binding declarations as the primary binding contract.
- [x] 2.2 Keep application-level variable typing only where it narrows or composes generated bindings.
- [x] 2.3 Add or update validation scripts so binding type drift is caught by local or CI checks.
- [x] 2.4 Add documentation notes for regenerating and checking Worker binding types.

## 3. Runtime Integration Tests

- [x] 3.1 Add Worker-runtime integration test setup using Cloudflare Workers Vitest integration or equivalent Miniflare-backed tooling.
- [x] 3.2 Apply committed D1 migrations or equivalent schema setup in integration tests.
- [x] 3.3 Cover built-in setup/login/logout/session rejection with runtime-backed request tests.
- [x] 3.4 Cover service/category/tag writes, constraints, and missing-record responses with runtime-backed D1 tests.
- [x] 3.5 Cover navigation KV miss/hit and post-write invalidation behavior with runtime-backed KV tests.
- [x] 3.6 Keep existing pure shared and helper tests fast and focused.

## 4. Navigation Mutation Boundary

- [x] 4.1 Introduce application service functions for service item mutations.
- [x] 4.2 Introduce application service functions for category and tag mutations.
- [x] 4.3 Move navigation cache invalidation out of route handlers and into successful service mutation paths.
- [x] 4.4 Add regression tests proving failed mutations do not invalidate cache and successful mutations do.

## 5. Deterministic Cache Invalidation

- [x] 5.1 Choose D1-backed or otherwise deterministic navigation cache version metadata.
- [x] 5.2 Add any required additive migration or metadata initialization.
- [x] 5.3 Replace KV read-modify-write version increments with the deterministic invalidation mechanism.
- [x] 5.4 Add tests for consecutive and concurrent-style writes so stale pre-write navigation payloads are not reused.

## 6. Session Touch Hardening

- [x] 6.1 Add a session touch threshold and update auth lookup logic to avoid touching every request.
- [x] 6.2 Add tests for repeated authenticated requests inside the threshold and stale sessions outside the threshold.
- [x] 6.3 Verify session expiry, revocation, logout, and current-user behavior are unchanged.

## 7. Verification

- [x] 7.1 Run `corepack pnpm validate`.
- [x] 7.2 Run Worker binding type generation/check commands.
- [x] 7.3 Run `openspec validate --all --strict --no-interactive`.
