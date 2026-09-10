# phase-1-service-navigation Specification

## MODIFIED Requirements

### Requirement: Unified service entry
Dockmark SHALL expose a single top-level service entry that combines everyday service navigation with service catalog management.

#### Scenario: User opens Dockmark root
- **WHEN** an authenticated user navigates to `/`
- **THEN** Dockmark SHALL redirect to `/services`
- **AND** the global navigation SHALL expose one service entry rather than separate Home and Services entries.

#### Scenario: User opens the unified service route
- **WHEN** the user navigates to `/services` without a view query
- **THEN** Dockmark SHALL show category-grouped service cards from the shared service catalog
- **AND** the same records SHALL be available in list view without loading a second service page.

#### Scenario: Unified service data is loading
- **WHEN** the service catalog is still loading
- **THEN** the loading skeleton SHALL match the currently selected card or list presentation
- **AND** list-view skeleton breakpoints SHALL match the list-view desktop/mobile breakpoints.

#### Scenario: User switches service presentation
- **WHEN** the user switches between card and list view
- **THEN** Dockmark SHALL reuse the already loaded service data and current filters
- **AND** list view SHALL be represented by `view=list`
- **AND** card view SHALL remain the default when no view query is present.

#### Scenario: User opens filters
- **WHEN** the user first opens the Services page
- **THEN** the filter form SHALL be hidden by default
- **AND** a filter icon beside the New Service action SHALL reveal or hide the shared filter form
- **AND** the filter icon SHALL expose and visually reflect its expanded state
- **AND** hiding the form SHALL NOT clear active filters.

#### Scenario: User collapses filters
- **WHEN** the expanded service filter form is hidden
- **THEN** the service content SHALL move into its final position as part of one continuous collapse transition
- **AND** removing the collapsed filter node SHALL NOT cause a second layout jump.

#### Scenario: User edits from card view
- **WHEN** a service card is displayed
- **THEN** the card SHALL expose an icon-only edit action in its upper-right actions area
- **AND** the action SHALL open the existing `/services/:id/edit` route.

#### Scenario: User maintains a service from list view
- **WHEN** the user opens an editor from `view=list`
- **THEN** create/edit URLs SHALL remain under `/services`
- **AND** leaving the editor SHALL return to list view.
