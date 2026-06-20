## 1. Validation Workflow

- [x] 1.1 Add non-mutating lint check scripts for the web package.
- [x] 1.2 Update the root validation path to use read-only lint checks.
- [x] 1.3 Preserve explicit lint fix or format commands for developer-initiated rewrites.

## 2. API Error Hardening

- [x] 2.1 Sanitize D1 uniqueness conflict responses while keeping `409` and `conflict`.
- [x] 2.2 Add Worker regression coverage proving raw D1 details are not returned to clients.

## 3. Navigation Cache Consistency

- [x] 3.1 Batch navigation mutations with cache version invalidation in the application service boundary.
- [x] 3.2 Add Worker regression coverage proving mutation writes roll back if cache version invalidation fails.

## 4. Production Operations

- [x] 4.1 Configure explicit Worker observability sampling.
- [x] 4.2 Document compatibility date, binding typecheck, dry-run deploy, and validation release gates.

## 5. Web API Client

- [x] 5.1 Add a shared JSON request helper for endpoint wrappers.
- [x] 5.2 Add focused tests for JSON serialization, header merging, structured errors, and 204 responses.

## 6. Local Generated Outputs

- [x] 6.1 Add a root cleanup command for ignored app/package build outputs and caches.
- [x] 6.2 Document the cleanup command in development instructions.

## 7. Verification

- [x] 7.1 Run focused Worker and web validation checks.
- [x] 7.2 Run `corepack pnpm validate`.
- [x] 7.3 Run `openspec validate --all --strict --no-interactive`.
