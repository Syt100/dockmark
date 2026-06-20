## Context

`corepack pnpm validate` currently invokes package lint scripts, and the web lint script runs fixers. This makes a validation command capable of modifying tracked files. Separately, the Worker maps D1 unique constraint failures to `409 conflict` but returns the raw database error message, which may include implementation details such as table and column names.

## Goals / Non-Goals

**Goals:**

- Keep `validate` non-mutating so it can be trusted as a gate.
- Preserve explicit commands for developers to auto-fix lint issues.
- Keep API errors structured with stable machine-readable codes.
- Avoid exposing raw D1 constraint messages to API clients.

**Non-Goals:**

- No changes to D1 schema, migrations, auth adapters, KV caching, or navigation behavior.
- No new product capabilities.
- No changes to password, token, API key, OTP seed, session cookie, or other secret storage.

## Decisions

### Split lint checking from lint fixing

Add package-level check scripts for validation and reserve fixer flags for explicit fix scripts. The root validation command will call the non-mutating lint check path.

Alternative considered: keep existing lint behavior and rely on developers to inspect diffs. That keeps the surprising side effect and makes CI semantics weaker.

### Sanitize D1 conflict responses

D1 uniqueness failures will still map to `409` with `error.code = conflict`, but clients will receive a stable generic message. Server-side logging can retain the original error for debugging.

Alternative considered: parse constraint names into field-specific validation errors. That would couple API behavior to current SQLite/D1 error text and is better handled by explicit preflight validation where needed.

## Risks / Trade-offs

- [Risk] Some developers may expect `pnpm lint` to auto-fix. -> Mitigation: expose explicit fix scripts and keep validation/check scripts read-only.
- [Risk] Generic conflict messages provide less immediate client detail. -> Mitigation: retain stable `conflict` code and add field-level validation separately for known user-correctable inputs where needed.
