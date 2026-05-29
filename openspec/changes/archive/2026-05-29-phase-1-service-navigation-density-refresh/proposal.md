## Why

The current management pages use card-heavy layouts for service, category, and tag records. This wastes desktop space, makes rows harder to scan, and saving from route-driven editors can leave the parent list stale until a manual refresh.

## What Changes

- Replace desktop service management cards with a dense, borderless table-like list that uses row hover highlighting.
- Replace desktop category and tag cards with compact, borderless management rows that use the same hover pattern.
- Keep mobile management views card-like but make them more compact and consistent.
- Remove the bordered wrapper around the service filter controls.
- Remove visible labels from the service search and select controls, relying on localized placeholders and option text.
- Refresh service, category, and tag lists reliably after create/edit flows return to the parent page.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `phase-1-service-navigation`: Management page presentation and refresh behavior becomes part of the Phase 1 service navigation user experience.

## Impact

- Affected Web views: `ServicesView.vue`, `CategoriesView.vue`, and `TagsView.vue`.
- Affected tests: frontend view tests for service filtering and save-return refresh behavior.
- No Worker API, database migration, dependency, or security boundary changes.
