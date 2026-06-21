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
