## Why

Phase 1 has the core service navigation data model and CRUD flows, but the Web UI is still a functional scaffold: English-only labels, always-visible management forms, unclear edit state, weak deletion safeguards, and only partial mobile responsiveness. This change makes the existing service navigation milestone practical for daily Homelab use before moving on to import/export and bookmark synchronization.

## What Changes

- Localize the service navigation UI to Chinese by default, including navigation, management pages, form labels, endpoint kind labels, statuses, empty states, and common feedback messages.
- Improve the home dashboard visual hierarchy and service card usability while keeping the product a dense, work-focused Homelab tool.
- Redesign Service, Category, and Tag management around clear create/edit flows instead of always-on top-of-page forms.
- Use route-driven create/edit screens:
  - Desktop renders create/edit routes as vertically and horizontally centered modals over the list context.
  - Mobile renders the same create/edit routes as normal document-flow pages, avoiding fixed fullscreen dialogs and fragile viewport-height assumptions.
- Add safer management interactions, including delete confirmation and clear success/error feedback.
- Add Tag editing support so tag management is consistent with category and service management.
- Improve mobile responsiveness for navigation, management lists, forms, and action areas.

Non-goals:

- Do not implement JSON import/export, R2 backups, scheduled backups, or bookmark synchronization in this change.
- Do not introduce full multi-language switching or a large i18n framework; Chinese is the default UI language for now.
- Do not store passwords, tokens, API keys, OTP seeds, session cookies, or any credential secrets.
- Do not replace the current Cloudflare Worker, D1, KV, Vue, Vite, and Tailwind architecture.
- Do not introduce a large UI component library unless an implementation blocker appears.

## Capabilities

### New Capabilities

- `phase-1.1-service-navigation-ux`: Defines Chinese UI, responsive create/edit behavior, management interaction quality, and mobile usability for the Phase 1 service navigation milestone.

### Modified Capabilities

- `phase-1-service-navigation`: Extends the existing service navigation milestone with user-facing management UX requirements, including localized labels, responsive route-driven editing, delete confirmation, tag editing, and mobile-friendly management views.

## Impact

- `apps/web`: Vue routes, service/category/tag pages, shared UI components, styles, and frontend tests.
- `apps/worker`: Tag update API support and cache invalidation for tag changes if missing.
- `packages/shared`: Shared endpoint/status label helpers or related pure functions if reused across views.
- `openspec`: New UX-focused change artifacts and spec deltas.
- No database migration is expected unless implementation discovers a missing field requirement.
