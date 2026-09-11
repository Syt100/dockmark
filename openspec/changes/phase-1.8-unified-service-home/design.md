# Design

## Unified Route
`/services` remains the canonical route because existing create/edit routes are already nested below it. `/` redirects to `/services`, and the global navigation exposes one Services item.

## Shared Catalog View
The Services page owns one service dataset loaded from `/api/items` together with categories. Search, category, status, and tag filters are shared regardless of presentation. Switching presentation never reloads service data.

The page supports two renderings of the same filtered records:

- **Cards** (default): category-grouped service cards optimized for scanning and opening endpoints. Each card also exposes an icon-only edit action.
- **List**: the existing dense management table/mobile list, including open, edit, and delete actions.

The selected rendering is represented by `view=list`; absence of the query means card view. Editor links preserve that query so returning from create/edit keeps the user's chosen presentation.

## Filter Disclosure
The filter form is collapsed by default. A filter icon sits beside the New Service action and toggles the shared filter form. Closing the form does not clear active filters. The control indicates when filters remain active.

## Editor Behavior
Existing `/services/new` and `/services/:id/edit` routes remain unchanged. Card and list edit actions both use these routes. When an editor was opened from list view, cancel, close, Escape, and successful save return to `/services?view=list`; card view returns to the default `/services` rendering.

## Compatibility
- `/` redirects to `/services`.
- `/services`, `/services/new`, and `/services/:id/edit` remain valid.
- `/api/nav` remains available and unchanged even though the unified web page no longer needs a separate navigation dataset.
- Other top-level routes remain unchanged.
