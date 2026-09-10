# Proposal

## Why
Dockmark currently exposes separate top-level Home and Services pages even though both center on the same service catalog. Home optimizes for opening active services, while Services optimizes for maintaining that same catalog. The split duplicates information architecture, navigation space, and user mental context.

## What Changes
- Consolidate service navigation and service management into one top-level Services route.
- Keep `/services` as the canonical route and redirect `/` to it for compatibility.
- Remove the separate Home item from the global navigation; the single Services item becomes the primary entry point.
- Default the unified page to a navigation/card view for everyday use, with an in-page switch to the existing management view.
- Preserve existing service create/edit child routes and return users to management mode after create/edit actions.
- Keep the existing `/api/nav` endpoint available; this change is frontend information architecture only.

## Non-Goals
- Changing Worker service data models or API semantics.
- Removing category, tag, import/export, or about pages.
- Reworking service card visuals beyond what is needed to embed navigation in the unified route.
