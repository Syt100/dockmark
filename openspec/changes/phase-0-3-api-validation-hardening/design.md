## Context

`corepack pnpm validate` currently invokes package lint scripts, and the web lint script runs fixers. This makes a validation command capable of modifying tracked files. Separately, the Worker maps D1 unique constraint failures to `409 conflict` but returns the raw database error message, which may include implementation details such as table and column names. Navigation mutations also update source rows before incrementing cache version metadata, so a failed invalidation can leave changed D1 data paired with an old KV cache version.

Production deployment docs already describe the broad release flow, but compatibility date updates, observability sampling, binding type checks, and dry-run deployment checks should be explicit release gates.

## Goals / Non-Goals

**Goals:**

- Keep `validate` non-mutating so it can be trusted as a gate.
- Preserve explicit commands for developers to auto-fix lint issues.
- Keep API errors structured with stable machine-readable codes.
- Avoid exposing raw D1 constraint messages to API clients.
- Keep navigation source mutations and cache version invalidation in one D1 consistency boundary.
- Make Worker observability and release checks explicit without adding new infrastructure.

**Non-Goals:**

- No changes to D1 schema, migrations, auth adapters, or product navigation behavior.
- No new monitoring vendor, queue, workflow, or external service dependency.
- No new product capabilities.
- No changes to password, token, API key, OTP seed, session cookie, or other secret storage.

## Decisions

### Split lint checking from lint fixing

Add package-level check scripts for validation and reserve fixer flags for explicit fix scripts. The root validation command will call the non-mutating lint check path.

Alternative considered: keep existing lint behavior and rely on developers to inspect diffs. That keeps the surprising side effect and makes CI semantics weaker.

### Sanitize D1 conflict responses

D1 uniqueness failures will still map to `409` with `error.code = conflict`, but clients will receive a stable generic message. Server-side logging can retain the original error for debugging.

Alternative considered: parse constraint names into field-specific validation errors. That would couple API behavior to current SQLite/D1 error text and is better handled by explicit preflight validation where needed.

### Batch navigation mutations with cache version increments

Navigation application services will execute source mutation statements and the navigation cache version increment through one `D1Database.batch()` call. D1 batch execution is sequential and rolls back the full sequence on failure, matching the requirement that source data and cache version metadata advance together.

Alternative considered: rebuild navigation from D1 on every read after writes. That avoids stale cache but discards the existing versioned KV cache benefit.

### Make production release gates explicit

Wrangler config will keep observability enabled with an explicit `head_sampling_rate`, and deployment docs will name the release checks expected before production deploys. This avoids relying on implicit defaults and keeps compatibility date updates tied to runtime-backed validation.

Alternative considered: adding automation for every release gate now. The existing GitHub Actions workflow already runs the key validation and deployment steps; documenting the operational contract is the smaller change for this hardening pass.

## Risks / Trade-offs

- [Risk] Some developers may expect `pnpm lint` to auto-fix. -> Mitigation: expose explicit fix scripts and keep validation/check scripts read-only.
- [Risk] Generic conflict messages provide less immediate client detail. -> Mitigation: retain stable `conflict` code and add field-level validation separately for known user-correctable inputs where needed.
- [Risk] Service-layer mutation code becomes more statement-oriented. -> Mitigation: keep route handlers unchanged and isolate batching inside application service functions.
- [Risk] Full observability sampling may be noisy at higher traffic. -> Mitigation: Dockmark is currently a low-traffic personal Homelab app; adjust sampling deliberately when traffic patterns justify it.
