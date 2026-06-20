## Purpose

Harden Dockmark's early backend and API foundation before later phases depend on unstable contracts, runtime mocks, or fragile cache behavior.

## Requirements

### Requirement: Structured API error contract

Dockmark SHALL expose API failures using a shared structured error response with stable machine-readable codes.

#### Scenario: Validation failure is returned

- **WHEN** a request payload fails validation
- **THEN** the Worker SHALL return a non-2xx response containing `error.code`, `error.message`, and optional field-level details
- **AND** the web client SHALL localize the error from `error.code` instead of matching arbitrary response text.

#### Scenario: Authentication failure is returned

- **WHEN** a protected API request is missing valid authentication
- **THEN** the Worker SHALL return an unauthorized structured error
- **AND** the response SHALL NOT reveal sensitive session token, password, setup token, or provider details.

#### Scenario: Internal error is returned

- **WHEN** an unexpected Worker error occurs
- **THEN** the Worker SHALL log the error server-side
- **AND** the API response SHALL use a generic structured internal-error code without exposing stack traces or secrets.

### Requirement: Generated Worker binding contract

Dockmark SHALL use Wrangler-generated binding types as the primary source of truth for Worker binding access.

#### Scenario: Wrangler configuration changes

- **WHEN** bindings, vars, or environments are changed in `wrangler.jsonc`
- **THEN** generated Worker type checks SHALL detect drift between configuration and application binding access.

#### Scenario: Application code reads bindings

- **WHEN** Worker code accesses D1, KV, assets, or configured vars
- **THEN** it SHALL use typed bindings derived from the Wrangler configuration
- **AND** it SHALL NOT rely on a separate hand-written binding interface that can silently diverge.

### Requirement: Runtime-backed Worker integration tests

Dockmark SHALL include Worker integration tests that exercise real Cloudflare Worker request handling and storage semantics for critical backend behavior.

#### Scenario: Migrations and D1 behavior are tested

- **WHEN** Worker integration tests run
- **THEN** they SHALL apply committed D1 migrations or equivalent schema setup
- **AND** they SHALL verify auth, service navigation writes, constraints, and not-found behavior against runtime-backed D1 semantics.

#### Scenario: KV cache behavior is tested

- **WHEN** navigation data is read, cached, mutated, and read again
- **THEN** integration tests SHALL verify cache miss/hit behavior and invalidation using runtime-backed KV semantics.

#### Scenario: Fast unit tests remain available

- **WHEN** pure shared validation or helper logic changes
- **THEN** it SHALL remain testable without requiring full Worker runtime setup.

### Requirement: Service navigation mutation boundary

Dockmark SHALL centralize service navigation mutations and cache invalidation behind application service functions.

#### Scenario: Service item is mutated

- **WHEN** a service item is created, updated, or deleted
- **THEN** the application service SHALL perform the D1 mutation and navigation cache invalidation as one application-level operation
- **AND** route handlers SHALL NOT need to remember separate cache invalidation calls.

#### Scenario: Category or tag is mutated

- **WHEN** a category or tag is created, updated, or deleted
- **THEN** the application service SHALL invalidate navigation cache state after a successful D1 mutation
- **AND** it SHALL NOT invalidate cache for failed or missing-record mutations.

### Requirement: Deterministic navigation cache invalidation

Dockmark SHALL invalidate navigation cache in a way that remains correct under concurrent writes while keeping D1 as the source of truth.

#### Scenario: Concurrent writes occur

- **WHEN** multiple service navigation mutations complete close together
- **THEN** the effective navigation cache version SHALL advance or otherwise become invalid for all completed writes
- **AND** a later `/api/nav` response SHALL be assembled from D1 rather than a stale pre-write payload.

#### Scenario: KV data is missing or stale

- **WHEN** KV lacks the cached navigation payload or contains an obsolete payload
- **THEN** the Worker SHALL rebuild the navigation response from D1
- **AND** it SHALL be safe to discard KV entries without losing source data.

### Requirement: Bounded session touch writes

Dockmark SHALL bound non-critical built-in session touch writes to avoid one D1 write per authenticated request.

#### Scenario: Authenticated requests are frequent

- **WHEN** several protected API requests use the same valid session within the touch threshold
- **THEN** Dockmark SHALL authenticate the requests without updating `last_seen_at` for every request.

#### Scenario: Session has not been touched recently

- **WHEN** a valid session's `last_seen_at` is older than the configured threshold
- **THEN** Dockmark SHALL update session activity without changing session token secrecy or expiration validation.

### Requirement: Phase 0.3 excludes product scope expansion

Phase 0.3 SHALL harden existing foundation behavior without adding later-phase product capabilities.

#### Scenario: Engineering hardening is implemented

- **WHEN** Phase 0.3 is complete
- **THEN** Dockmark SHALL preserve existing service navigation, built-in auth, and production deployment behavior
- **AND** it SHALL NOT add bookmark sync, extension sync, import/export, OIDC login, Cloudflare Access JWT validation, or Homelab credential storage.

### Requirement: Non-mutating validation gate

Dockmark SHALL provide a validation command that checks type safety, tests, lint rules, and builds without modifying tracked source files.

#### Scenario: Validation is run

- **WHEN** a developer runs the root validation command
- **THEN** linting SHALL run in check mode without auto-fix flags
- **AND** formatting or lint fixes SHALL require an explicit fix or format command.

### Requirement: Sanitized persistence conflict errors

Dockmark SHALL map persistence uniqueness conflicts to stable structured API errors without exposing raw database implementation details to clients.

#### Scenario: Unique constraint conflict occurs

- **WHEN** D1 rejects a create or update operation because of a uniqueness constraint
- **THEN** the Worker SHALL return HTTP 409 with `error.code` set to `conflict`
- **AND** the response body SHALL NOT include raw D1 messages such as table names, column names, SQL fragments, or `UNIQUE constraint failed`.

### Requirement: Atomic navigation mutation invalidation

Dockmark SHALL apply service navigation source mutations and navigation cache version invalidation in one D1 consistency boundary.

#### Scenario: Cache version invalidation fails during a mutation

- **WHEN** a category, tag, or service item mutation cannot advance the navigation cache version
- **THEN** the corresponding source data mutation SHALL NOT remain committed
- **AND** a later navigation read SHALL NOT depend on a stale cache version for changed source data.

### Requirement: Explicit Worker release gates

Dockmark SHALL document and configure Worker production release checks so deployment behavior does not depend on implicit local defaults.

#### Scenario: Production release is prepared

- **WHEN** a production Worker release is prepared
- **THEN** the release checklist SHALL include validation, OpenSpec validation, Wrangler binding type checks, and production dry-run deployment checks
- **AND** Worker observability SHALL be explicitly enabled with a configured sampling rate.

#### Scenario: Compatibility date is updated

- **WHEN** the Worker compatibility date changes
- **THEN** Worker runtime integration tests and the root validation gate SHALL pass before release.

### Requirement: Centralized web JSON requests

Dockmark SHALL keep web API request serialization and structured error handling in a shared client helper rather than repeating low-level fetch details across endpoint wrappers.

#### Scenario: JSON request is sent

- **WHEN** a web API wrapper sends a JSON request body
- **THEN** the body SHALL be serialized by the shared client helper
- **AND** caller-provided headers SHALL be preserved.

#### Scenario: Empty response is returned

- **WHEN** an API response returns HTTP 204
- **THEN** the shared client helper SHALL resolve without attempting to parse JSON.

### Requirement: Ignored build output cleanup

Dockmark SHALL provide a workspace cleanup command for ignored generated outputs without deleting tracked source files.

#### Scenario: Cleanup is requested

- **WHEN** a developer runs the cleanup command
- **THEN** ignored build outputs, caches, and TypeScript build info under workspace apps and packages SHALL be removed
- **AND** tracked files SHALL remain untouched.
