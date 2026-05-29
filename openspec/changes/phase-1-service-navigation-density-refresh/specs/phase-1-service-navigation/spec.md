## ADDED Requirements

### Requirement: Management lists are dense and scannable
Dockmark SHALL present service, category, and tag management pages as compact management lists on desktop while preserving mobile readability.

#### Scenario: Service management renders on desktop
- **WHEN** the user opens the service management page on a desktop-width viewport
- **THEN** services SHALL be presented in borderless table-like rows with hover highlighting
- **AND** each row SHALL expose the service identity, category or status context, primary address, tags or tag summary, credential hint or address summary, and row actions without wrapping each service in a standalone card

#### Scenario: Category and tag management render on desktop
- **WHEN** the user opens the category or tag management page on a desktop-width viewport
- **THEN** records SHALL be presented as compact borderless rows with hover highlighting
- **AND** records SHALL NOT be wrapped in separate card containers

#### Scenario: Management lists render on mobile
- **WHEN** the user opens a management page on a mobile-width viewport
- **THEN** records SHALL remain readable in stacked mobile layouts
- **AND** mobile layouts SHALL avoid horizontal table overflow

### Requirement: Service filters are visually lightweight
Dockmark SHALL present service management filters as inline controls without a bordered panel or visible field labels.

#### Scenario: Service filters are displayed
- **WHEN** the user opens the service management page
- **THEN** the search input and filter select controls SHALL appear without an outer bordered wrapper
- **AND** visible labels SHALL be omitted
- **AND** the controls SHALL still expose accessible names through attributes or equivalent semantics

### Requirement: Management lists refresh after editor saves
Dockmark SHALL refresh service, category, and tag management data after a successful create or edit flow returns to the parent list.

#### Scenario: Service is created or edited
- **WHEN** the service editor saves successfully and navigates back to the service management page
- **THEN** the service list SHALL reload from the API
- **AND** the saved service SHALL be visible without requiring a manual browser refresh

#### Scenario: Category or tag is created or edited
- **WHEN** the category or tag editor saves successfully and navigates back to its parent management page
- **THEN** the corresponding list SHALL reload from the API
- **AND** the saved record SHALL be visible without requiring a manual browser refresh
