# Proposal

## Why
Dockmark currently exposes separate service navigation and service management presentations for the same catalog. Even after consolidating them onto one route, treating them as distinct modes still duplicates page structure and mental context. The user should be able to work with one service catalog and choose only how it is rendered.

## What Changes
- Keep `/services` as the single canonical service route and redirect `/` to it.
- Remove separate navigation/management modes and use one shared service dataset and filter state.
- Make card view the default presentation for opening and browsing services.
- Add a list-view presentation for denser management without loading a second page implementation.
- Replace the always-visible filter row with a filter icon beside the create action; the filter form is collapsed by default.
- Add an icon-only edit action to every service card.
- Preserve existing service create/edit child routes and the selected card/list view across editor round trips.
- Keep `/api/nav` available for compatibility; this change does not remove Worker API capabilities.

## Non-Goals
- Changing Worker service data models or API semantics.
- Removing category, tag, import/export, or about pages.
- Adding a second set of filter semantics for card and list presentations.
