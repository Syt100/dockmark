# Tasks

- [x] Redirect `/` to the canonical `/services` route.
- [x] Remove the duplicate Home item from global navigation and point the Dockmark brand to `/services`.
- [x] Replace navigation/management modes with card/list renderings of one shared service dataset.
- [x] Make card view the default and persist list view with `view=list`.
- [x] Collapse service filters by default and toggle them from an icon beside New Service.
- [x] Preserve active filters while the filter form is collapsed.
- [x] Add icon-only edit actions to service cards.
- [x] Preserve `/services/new` and `/services/:id/edit` child routes and selected view across editor returns.
- [x] Add regression coverage for shared view switching, hidden filters, and card editing.
- [ ] Run `corepack pnpm validate` after the final implementation update.
- [ ] Run `openspec validate --all --strict --no-interactive` when the CLI is available.
