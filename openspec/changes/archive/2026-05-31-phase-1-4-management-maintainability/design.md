## Context

The current Vue app has separate management views for services, categories, and tags. They share several patterns:

- `load()` state with `isLoading`, `error`, and API calls.
- Saved flash handling through `route.query.saved`.
- Delete action handling with feedback and reload.
- Search filtering against local data.
- Editors that load reference data and map API models into mutable form objects.

This duplication is manageable today, but it will become noisy as import/export, bookmark import, extension sync, and additional management surfaces arrive. The goal is to extract only stable patterns that reduce repeated behavior without hiding page-specific domain logic.

## Goals / Non-Goals

**Goals:**

- Reduce repeated list loading, saved flash, deletion, and error handling code across management views.
- Add direct single-record category/tag loading contracts for editor pages.
- Keep editor data mapping explicit but reusable enough to avoid inconsistent payload conversion.
- Improve shared form controls so common numeric and input attribute needs do not bypass the component layer.
- Preserve current UI behavior, routes, labels, styling, and responsive editor shell behavior.

**Non-Goals:**

- No redesign of management pages or service cards.
- No state management library unless the implementation proves existing Vue refs/composables are insufficient.
- No server-side pagination, sorting, or filtering in this phase.
- No import/export, sync, browser extension, auth provider, or secret storage behavior.

## Decisions

### Extract composables around stable workflow patterns

Introduce small Vue composables for repeated behavior, such as:

- list loading state and reload orchestration
- saved flash query interpretation
- deletion with feedback and reload
- common API error-to-message conversion

Keep domain-specific filtering, row shaping, and editor-specific fields in the view or dedicated domain helpers.

Alternative considered: introduce a global store for management data. This would be premature because data lifetimes are local to each management page and the current app does not need cross-tab or optimistic synchronization.

### Add single-record APIs for categories and tags

Add `GET /api/categories/:id` and `GET /api/tags/:id` or equivalent client contracts so editors can load the target record directly. This avoids full-list fetches for edit screens and aligns category/tag behavior with item editing.

Alternative considered: keep loading full collections. That is acceptable at current scale, but it embeds inefficient assumptions and inconsistent API shape into editors.

### Keep form mapping explicit and typed

Use small mapper functions for model-to-form and form-to-input conversion. They should be tested where they normalize nullable fields, numeric values, endpoint order, selected tags, or slug defaults.

Alternative considered: make a generic form builder. Dockmark's forms are domain-specific, so a generic builder would likely obscure validation and future product rules.

### Extend shared controls instead of bypassing them

Shared components such as `AppInput` should support common input attributes and typed numeric use cases cleanly. Views should not need raw controls only because a shared component cannot represent a normal form field.

Alternative considered: allow occasional raw inputs. That increases visual and accessibility drift as forms grow.

## Risks / Trade-offs

- [Risk] Over-abstracting page logic can make simple views harder to read. -> Mitigation: extract only behavior repeated across at least two pages and keep domain-specific computed values local.
- [Risk] Adding single-record APIs touches Worker and web. -> Mitigation: keep response envelopes consistent with existing collection APIs and add focused route tests.
- [Risk] Refactoring views can cause subtle UI regressions. -> Mitigation: keep rendered copy and routes stable, and update behavior-focused tests rather than class-string assertions.
- [Risk] Composables may duplicate future global data cache behavior. -> Mitigation: keep them small and replaceable, with no persistence assumptions.

## Migration Plan

1. Add category/tag single-record API contracts and tests.
2. Extend shared form controls for numeric and common attribute support.
3. Extract saved flash and list loading/deletion composables.
4. Refactor category/tag management pages first because they are smaller.
5. Refactor service management and editor mapping after the shared patterns are proven.
6. Run frontend and full project validation.

Rollback is code-only: restore views to direct local state and keep single-record APIs if already released, since they are additive.

## Open Questions

- Should single-record category/tag responses use `{ category }` and `{ tag }` to match existing create/update responses? The default answer should be yes for consistency.
- Should saved flash query values be removed from the URL after display? This can be included if it does not alter navigation expectations or tests.
