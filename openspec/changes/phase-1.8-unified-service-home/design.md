# Design

## Unified Route
`/services` remains the canonical route because existing create/edit routes are already nested below it. `/` redirects to `/services`, preserving root entry compatibility without keeping a second page implementation.

The global navigation exposes one Services item instead of separate Home and Services items. The Dockmark brand link also points to `/services` so authenticated entry consistently lands on the unified service surface.

## Page Modes
The unified Services page has two modes:

- **Navigation** (default): renders the existing service-navigation card experience optimized for opening active services.
- **Management**: renders the existing table/card management experience including status/category/tag filters, create, edit, and delete actions.

Mode is represented by the `mode=manage` query parameter so it is shareable and survives editor round trips. Absence of the parameter means navigation mode.

## Data Loading
The navigation child keeps using the existing cached `/api/nav` endpoint. Management data (`/api/items` + categories) is loaded lazily only when management mode is entered or an editor return requires reconciliation. This avoids making the default service-launch experience pay for management-only data requests.

## Editor Return Behavior
Existing `/services/new` and `/services/:id/edit` routes remain unchanged. The parent unified route stays mounted for desktop overlays. Create/edit success, cancel, Escape, and close actions return to `/services?mode=manage` so users do not unexpectedly fall back to navigation mode while maintaining records.

## Compatibility
- `/` redirects to `/services`.
- `/services`, `/services/new`, and `/services/:id/edit` remain valid.
- `/api/nav` remains available and unchanged.
- Other top-level routes remain unchanged.
