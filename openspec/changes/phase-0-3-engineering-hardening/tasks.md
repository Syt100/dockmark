## 1. API Error Contract

- [ ] 1.1 Add shared structured API error response types and stable error code definitions.
- [ ] 1.2 Update Worker global error handling and route helpers to emit structured errors with existing status codes.
- [ ] 1.3 Update validation, auth, conflict, and not-found paths to use stable error codes.
- [ ] 1.4 Update the web API client and Chinese error mapping to prefer structured error codes with a temporary text fallback.
- [ ] 1.5 Add regression tests for structured validation, auth, not-found, conflict, and internal error responses.

## 2. Worker Binding Types

- [ ] 2.1 Refactor Worker environment typing to use Wrangler-generated binding declarations as the primary binding contract.
- [ ] 2.2 Keep application-level variable typing only where it narrows or composes generated bindings.
- [ ] 2.3 Add or update validation scripts so binding type drift is caught by local or CI checks.
- [ ] 2.4 Add documentation notes for regenerating and checking Worker binding types.

## 3. Runtime Integration Tests

- [ ] 3.1 Add Worker-runtime integration test setup using Cloudflare Workers Vitest integration or equivalent Miniflare-backed tooling.
- [ ] 3.2 Apply committed D1 migrations or equivalent schema setup in integration tests.
- [ ] 3.3 Cover built-in setup/login/logout/session rejection with runtime-backed request tests.
- [ ] 3.4 Cover service/category/tag writes, constraints, and missing-record responses with runtime-backed D1 tests.
- [ ] 3.5 Cover navigation KV miss/hit and post-write invalidation behavior with runtime-backed KV tests.
- [ ] 3.6 Keep existing pure shared and helper tests fast and focused.

## 4. Navigation Mutation Boundary

- [ ] 4.1 Introduce application service functions for service item mutations.
- [ ] 4.2 Introduce application service functions for category and tag mutations.
- [ ] 4.3 Move navigation cache invalidation out of route handlers and into successful service mutation paths.
- [ ] 4.4 Add regression tests proving failed mutations do not invalidate cache and successful mutations do.

## 5. Deterministic Cache Invalidation

- [ ] 5.1 Choose D1-backed or otherwise deterministic navigation cache version metadata.
- [ ] 5.2 Add any required additive migration or metadata initialization.
- [ ] 5.3 Replace KV read-modify-write version increments with the deterministic invalidation mechanism.
- [ ] 5.4 Add tests for consecutive and concurrent-style writes so stale pre-write navigation payloads are not reused.

## 6. Session Touch Hardening

- [ ] 6.1 Add a session touch threshold and update auth lookup logic to avoid touching every request.
- [ ] 6.2 Add tests for repeated authenticated requests inside the threshold and stale sessions outside the threshold.
- [ ] 6.3 Verify session expiry, revocation, logout, and current-user behavior are unchanged.

## 7. Verification

- [ ] 7.1 Run `corepack pnpm validate`.
- [ ] 7.2 Run Worker binding type generation/check commands.
- [ ] 7.3 Run `openspec validate --all --strict --no-interactive`.
