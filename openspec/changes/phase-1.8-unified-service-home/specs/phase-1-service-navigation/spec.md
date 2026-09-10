# phase-1-service-navigation Specification

## MODIFIED Requirements

### Requirement: Unified service entry
Dockmark SHALL expose a single top-level service entry that combines everyday service navigation with service catalog management.

#### Scenario: User opens Dockmark root
- **WHEN** an authenticated user navigates to `/`
- **THEN** Dockmark SHALL redirect to `/services`
- **AND** the global navigation SHALL expose one service entry rather than separate Home and Services entries.

#### Scenario: User opens the unified service route
- **WHEN** the user navigates to `/services` without a management mode query
- **THEN** Dockmark SHALL show the existing category-grouped active-service navigation cards
- **AND** service search SHALL remain available for everyday launching.

#### Scenario: User switches to management
- **WHEN** the user selects management mode
- **THEN** Dockmark SHALL show the existing service management filters and records on the same top-level route
- **AND** the route SHALL represent that state with `mode=manage`.

#### Scenario: User maintains a service
- **WHEN** the user opens `/services/new` or `/services/:id/edit`
- **THEN** the existing service editor behavior SHALL remain available
- **AND** leaving the editor for `/services` SHALL return the unified page to management mode.

#### Scenario: User uses the default navigation view
- **WHEN** management mode has not been requested
- **THEN** Dockmark SHALL NOT eagerly issue management-list API requests solely to render the navigation view.
