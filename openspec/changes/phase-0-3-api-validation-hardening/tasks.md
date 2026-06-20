## 1. Validation Workflow

- [x] 1.1 Add non-mutating lint check scripts for the web package.
- [x] 1.2 Update the root validation path to use read-only lint checks.
- [x] 1.3 Preserve explicit lint fix or format commands for developer-initiated rewrites.

## 2. API Error Hardening

- [x] 2.1 Sanitize D1 uniqueness conflict responses while keeping `409` and `conflict`.
- [x] 2.2 Add Worker regression coverage proving raw D1 details are not returned to clients.

## 3. Verification

- [x] 3.1 Run focused Worker and web validation checks.
- [x] 3.2 Run `corepack pnpm validate`.
- [x] 3.3 Run `openspec validate --all --strict --no-interactive`.
