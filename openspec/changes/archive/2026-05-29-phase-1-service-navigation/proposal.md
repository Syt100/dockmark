## Why

Dockmark's first useful product milestone should replace a personal Homelab navigation page before bookmark sync exists. This change delivers the core service dashboard with categories, multi-endpoint service entries, tags, safe credential hints, and cached home navigation.

## What Changes

- Add D1 tables and migrations for categories, items, endpoints, tags, and item_tags.
- Implement authenticated CRUD APIs for service navigation data.
- Store all service addresses in `endpoints`; do not duplicate `primary_url` or `internal_url` fields on `items`.
- Implement `/api/nav` for home navigation grouped by category.
- Add versioned KV cache for home navigation and invalidate it after navigation writes.
- Add Vue UI pages for home navigation, service management, category management, and basic tag management.
- Enforce the credential boundary by storing only Vaultwarden or credential lookup hints, never secrets.

Non-goals:

- Do not implement bookmarks.html import in this change.
- Do not implement browser extension sync in this change.
- Do not implement R2 icons, screenshots, or automatic backups in this change.
- Do not implement password storage, password fields, API key fields, or OTP seed fields.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `phase-1-service-navigation`: Implement the service navigation capability defined by the existing Phase 1 spec.

## Impact

- Affected directories: `apps/worker`, `apps/web`, `packages/shared`, `migrations`.
- Affected APIs: `/api/nav`, `/api/items`, `/api/categories`, `/api/tags`.
- Affected data: D1 service navigation tables and KV navigation cache keys.
- Depends on Phase 0 project foundation, auth adapter, D1/KV bindings, and web/Worker baseline.

