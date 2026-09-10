# Tasks

- [x] Redirect `/` to the canonical `/services` route.
- [x] Remove the duplicate Home item from global navigation and point the Dockmark brand to `/services`.
- [x] Replace navigation/management modes with card/list renderings of one shared service dataset.
- [x] Make card view the default and persist list view with `view=list`.
- [x] Collapse service filters by default and toggle them from an icon beside New Service.
- [x] Preserve active filters while the filter form is collapsed.
- [x] Add icon-only edit actions to service cards.
- [x] Preserve `/services/new` and `/services/:id/edit` child routes and selected view across editor returns.
- [x] Match the service loading skeleton to the active card/list presentation and responsive breakpoint.
- [x] Visually reflect the expanded state on the filter icon.
- [x] Make filter collapse include the disappearing layout gap so content moves continuously.
- [x] Add regression coverage for shared view switching, hidden filters, card editing, view-matched skeletons, and expanded icon state.
- [ ] Run `corepack pnpm validate` after the final implementation update.
- [ ] Run `openspec validate --all --strict --no-interactive` when the CLI is available.
