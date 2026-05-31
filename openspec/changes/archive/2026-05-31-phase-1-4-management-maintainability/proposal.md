## Why

The Phase 1 management UI is usable and visually normalized, but list and editor pages repeat the same loading, flash, search, delete, and lookup patterns. This change reduces future feature cost before more management pages, import flows, and sync-related views multiply the same code paths.

## What Changes

- Add shared frontend composables or helpers for CRUD list loading, saved-state flash messages, deletion feedback, and common error handling.
- Add focused API support for fetching a single category or tag by ID so editor pages do not need to load full collections just to edit one record.
- Normalize editor form data mapping so service/category/tag editors convert API models to form state and submit payloads consistently.
- Improve type-safe form controls for numeric fields and common input attributes.
- Keep the existing visual design, routes, data semantics, and Phase 1 user workflows unchanged.

## Capabilities

### New Capabilities

- `phase-1.4-management-maintainability`: Covers frontend management-page maintainability, editor data-loading contracts, and reusable CRUD UI patterns.

### Modified Capabilities

- None.

## Non-goals

- No service navigation redesign, landing page, dashboard layout change, or visual theme change.
- No import/export, bookmark import, browser extension sync, bookmark sync, or R2 asset workflow.
- No authentication provider change, role management, sharing, or permission model.
- No storage of service passwords, API keys, tokens, OTP seeds, session cookies, or other service secrets.

## Impact

- Affected code: `apps/web` list views, editor views, API client, shared components, composables/helpers, and frontend tests.
- Affected code: `apps/worker` category/tag read APIs and route tests if single-record endpoints are added.
- Affected code: `packages/shared` response types if single-record API contracts are shared.
- Expected behavior: existing management workflows should remain the same from the user's perspective.
