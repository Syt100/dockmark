## 1. Single-Record API Contracts

- [ ] 1.1 Add shared response types for single category and single tag reads if needed.
- [ ] 1.2 Add authenticated `GET /api/categories/:id` and `GET /api/tags/:id` Worker routes.
- [ ] 1.3 Add API client functions for fetching one category and one tag.
- [ ] 1.4 Add Worker tests for successful and missing category/tag reads.
- [ ] 1.5 Add frontend tests proving editors use direct record loading and handle not-found responses.

## 2. Shared Form Controls

- [ ] 2.1 Extend `AppInput` or add a shared numeric input path that preserves numeric values for form state.
- [ ] 2.2 Verify shared controls pass through common input attributes without losing styles or accessible names.
- [ ] 2.3 Replace raw management-editor inputs that only exist because shared controls lacked coverage.
- [ ] 2.4 Add component tests for numeric value handling and attribute passthrough.

## 3. Management Workflow Composables

- [ ] 3.1 Add a saved-flash helper for interpreting create/update route markers and feedback messages.
- [ ] 3.2 Add a list loading helper for `isLoading`, `error`, reload, and error mapping.
- [ ] 3.3 Add a deletion helper for clearing feedback, calling delete APIs, reporting success, and reloading.
- [ ] 3.4 Keep helpers generic enough for services, categories, and tags without hiding domain-specific labels or filtering.

## 4. View Refactor

- [ ] 4.1 Refactor category list and editor views to use direct record loading and shared workflow helpers.
- [ ] 4.2 Refactor tag list and editor views to use direct record loading and shared workflow helpers.
- [ ] 4.3 Refactor service list shared loading, saved-flash, deletion, and editor form mapping where it removes meaningful duplication.
- [ ] 4.4 Confirm existing routes, labels, search, filters, empty states, and responsive editor behavior are unchanged.

## 5. Tests And Verification

- [ ] 5.1 Update frontend view tests to cover the refactored shared workflows through user-visible behavior.
- [ ] 5.2 Add focused tests for model-to-form and form-to-input mapping where nullable or numeric conversion can regress.
- [ ] 5.3 Run `corepack pnpm --filter @dockmark/web test`.
- [ ] 5.4 Run `corepack pnpm --filter @dockmark/worker test`.
- [ ] 5.5 Run `corepack pnpm validate`.
- [ ] 5.6 Run `openspec validate --all --strict --no-interactive`.
