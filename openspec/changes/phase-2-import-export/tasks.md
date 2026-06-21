## 1. Shared Contracts

- [x] 1.1 Add shared TypeScript types and validation for Dockmark export documents, import modes, preview summaries, and import results.
- [x] 1.2 Add shared tests for valid documents, unsupported schema versions, invalid relationships, invalid endpoints, and forbidden secret fields.

## 2. Worker API

- [x] 2.1 Implement authenticated JSON export API.
- [x] 2.2 Implement import preview API with additive conflict detection and no D1 writes.
- [x] 2.3 Implement import execution API for additive and replace-all modes with all-or-nothing writes.
- [x] 2.4 Invalidate navigation cache after successful imports.
- [x] 2.5 Add Worker tests for export shape, preview validation, additive conflicts, replace-all restore, and cache invalidation.

## 3. Web UI

- [x] 3.1 Add import/export client helpers.
- [x] 3.2 Add import/export route and navigation entry.
- [x] 3.3 Add UI for JSON download, file upload, import mode selection, preview summary, validation errors, replace-all confirmation, and success feedback.
- [x] 3.4 Add web tests for export action, preview errors, replace-all confirmation, and successful import feedback.

## 4. Verification

- [x] 4.1 Run `corepack pnpm validate`.
- [x] 4.2 Run `openspec validate --all --strict --no-interactive`.

## 5. Import/Export Hardening

- [x] 5.1 Add import payload size and record count limits shared between preview and execution.
- [x] 5.2 Strengthen replace-all UI confirmation by requiring a typed phrase and showing current data counts.
- [x] 5.3 Add real D1 integration tests for import/export replace-all success, rollback, and limit rejection.
- [x] 5.4 Run `corepack pnpm validate`.
- [x] 5.5 Run `openspec validate --all --strict --no-interactive`.

## 6. Skip Conflicts Import

- [x] 6.1 Add structured import issues and additive skip-conflicts contracts.
- [x] 6.2 Implement skip-conflicts planning and import execution with dependency-safe skipped records.
- [x] 6.3 Update import preview UI to group issues and offer skip-conflicts import when safe.
- [x] 6.4 Add shared, Worker, integration, and Web tests for grouped conflicts and skip-conflicts import.
- [x] 6.5 Run `corepack pnpm validate`.
- [x] 6.6 Run `openspec validate --all --strict --no-interactive`.

## 7. Preview Detail and Guidance

- [x] 7.1 Add export metadata, record-level import details, import result details, and secret-warning contracts.
- [x] 7.2 Implement Worker preview/result detail generation and secret-warning issues.
- [x] 7.3 Update import/export UI with mode explanations, record-level details, confirmation summaries, friendlier issue text, and result details.
- [x] 7.4 Document import/export API format, modes, limits, and warning behavior.
- [x] 7.5 Add shared, Worker, integration, and Web tests for metadata, secret warnings, record details, and UI guidance.
- [x] 7.6 Run `corepack pnpm validate`.
- [x] 7.7 Run `openspec validate --all --strict --no-interactive`.
