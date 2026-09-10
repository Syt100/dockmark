# Tasks

- [ ] Redirect `/` to the canonical `/services` route.
- [ ] Remove the duplicate Home item from global navigation and point the Dockmark brand to `/services`.
- [ ] Add navigation/management modes to the Services page with navigation as the default.
- [ ] Reuse the existing service navigation card experience inside the unified Services route.
- [ ] Load management data only when management mode or editor reconciliation requires it.
- [ ] Preserve `/services/new` and `/services/:id/edit` child routes.
- [ ] Return service editor exits and successful saves to management mode.
- [ ] Add regression coverage for root redirect, unified navigation, mode switching, and editor return behavior.
- [ ] Run `corepack pnpm validate`.
- [ ] Run `openspec validate --all --strict --no-interactive` when the CLI is available.
