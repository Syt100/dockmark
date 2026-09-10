# Tasks

- [x] Redirect `/` to the canonical `/services` route.
- [x] Remove the duplicate Home item from global navigation and point the Dockmark brand to `/services`.
- [x] Add navigation/management modes to the Services page with navigation as the default.
- [x] Reuse the existing service navigation card experience inside the unified Services route.
- [x] Load management data only when management mode or editor reconciliation requires it.
- [x] Preserve `/services/new` and `/services/:id/edit` child routes.
- [x] Return service editor exits and successful saves to management mode.
- [x] Add regression coverage for root redirect, unified navigation, mode switching, and editor return behavior.
- [x] Run `corepack pnpm validate`.
- [ ] Run `openspec validate --all --strict --no-interactive` when the CLI is available.
