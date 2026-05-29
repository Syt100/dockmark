## Context

Phase 1 already provides D1-backed service navigation data, Worker CRUD APIs, a cached `/api/nav` endpoint, and Vue management pages. The current Web UI is intentionally simple, but it is not yet comfortable for daily use: most labels are English, create/edit forms are always visible at the top of list pages, edit state is easy to miss, delete actions have no confirmation, tags cannot be edited, and mobile support relies mostly on grid wrapping.

This change improves the existing Phase 1 product surface without changing the core data model. It keeps Dockmark as a focused Homelab operations tool rather than a marketing-style site.

## Goals / Non-Goals

**Goals:**

- Make the Web UI Chinese by default.
- Improve dashboard and management page visual hierarchy while keeping information dense and scannable.
- Provide clear create/edit flows for services, categories, and tags.
- Use desktop-centered modal editing while using normal document-flow edit pages on mobile.
- Avoid fragile mobile fullscreen modal patterns that rely on fixed positioning or `100vh`.
- Add delete confirmation, success/error feedback, loading states, and empty states.
- Add Tag editing support with matching cache invalidation.
- Improve mobile navigation, management lists, and form layouts.

**Non-Goals:**

- Full i18n language switching.
- Import/export, backups, bookmark import, or browser extension sync.
- New database fields or large data model changes.
- Large UI component framework adoption.
- Storing usernames, passwords, tokens, OTP seeds, session cookies, or other secrets.

## Decisions

### Route-driven create/edit UI

Create/edit uses explicit routes such as `/services/new`, `/services/:id/edit`, `/categories/new`, `/categories/:id/edit`, `/tags/new`, and `/tags/:id/edit`.

Desktop viewports render these routes as centered modals over the list context. Mobile viewports render the same form components as ordinary pages in document flow.

Alternatives considered:

- Always use modals: rejected because mobile browser dynamic viewport, address bar, input method, and scroll behavior can obscure fixed or fullscreen overlays.
- Always use full pages: rejected because desktop management is faster when the list context remains visible.
- Inline list editing: rejected because service forms have nested endpoint and tag sections that make inline editing hard to scan and easy to misoperate.

### Shared form components with different shells

Service, category, and tag forms should be implemented once and mounted inside either a desktop modal shell or a mobile page shell. The shell controls layout, close behavior, and backdrop; the form owns validation state, submit state, and field rendering.

### Mobile layout avoids fixed fullscreen dialogs

Mobile edit pages must not lock body scrolling or rely on `height: 100vh`. They should use normal document flow. Sticky action bars are allowed only as a convenience, not as the only submit path, and must account for safe-area inset.

### Chinese default without full i18n

Text is localized directly or via small local label maps. A full i18n package is deferred until the product needs runtime language switching. Endpoint kinds and service statuses should have shared display-label maps if they are used in multiple components.

### Management lists use cards over mobile tables

Desktop can use compact cards or tables depending on density. Mobile should use stacked cards with clear action areas instead of wide tables. This avoids horizontal overflow and keeps destructive actions visible but separated.

### Delete confirmation stays contextual

Desktop can use a compact confirmation state or modal. Mobile should prefer contextual confirmation inside the card/action area instead of a fullscreen dialog. This keeps the user in normal page flow and avoids viewport issues.

### Tag update API

Tags currently support create/list/delete but not update. This change adds authenticated tag update support in the Worker, with validation and navigation cache invalidation matching category update behavior.

## Risks / Trade-offs

- [Risk] Route-driven modal state may be more complex than always-on forms.  
  Mitigation: keep form components independent and use small shell components for desktop/mobile presentation.

- [Risk] CSS breakpoint detection can diverge from runtime viewport behavior.  
  Mitigation: use CSS responsive classes for presentation and avoid behavior that requires exact JavaScript viewport measurements.

- [Risk] Direct Chinese strings make future language switching more work.  
  Mitigation: keep repeated labels in local maps/helpers so a later i18n migration has obvious boundaries.

- [Risk] Desktop modal plus mobile page may create duplicated markup.  
  Mitigation: extract `ServiceEditorForm`, `CategoryEditorForm`, and `TagEditorForm`; only shells differ.

- [Risk] Improved UI could expand scope into a full design system.  
  Mitigation: add only the reusable components needed for this phase: page header, buttons, confirmation action, modal shell, and status/label helpers.

## Migration Plan

1. Add UX OpenSpec artifacts and validate them.
2. Add any missing Worker API support for tag update.
3. Add shared label helpers where useful.
4. Refactor Web pages and routes to the route-driven create/edit model.
5. Add tests for route rendering, tag update, and key responsive/interaction behavior.
6. Run OpenSpec and workspace validation.

Rollback is limited to reverting this change because no database migration is expected.
