# phase-1-5-interaction-motion Specification

## Purpose
Define lightweight, reusable frontend motion requirements for Phase 1 service navigation and management workflows.

## ADDED Requirements
### Requirement: Shared Motion System
Dockmark SHALL centralize common frontend motion values and transition classes instead of duplicating animation CSS across individual views.

#### Scenario: Shared motion is used
- **WHEN** route changes, dialogs, feedback messages, list items, or dynamic form rows animate
- **THEN** they SHALL use shared motion tokens or shared transition classes
- **AND** page-specific animation CSS SHALL be avoided unless the interaction has a unique requirement.

### Requirement: Reduced Motion Support
Dockmark SHALL respect the user's reduced-motion preference.

#### Scenario: User prefers reduced motion
- **WHEN** the browser reports `prefers-reduced-motion: reduce`
- **THEN** non-essential transform, scale, slide, and layout movement animations SHALL be disabled or minimized
- **AND** UI state changes SHALL remain clear and accessible.

### Requirement: Route and Panel Transitions
Dockmark SHALL make route and modal/editor transitions visually traceable without changing navigation semantics.

#### Scenario: User changes routes
- **WHEN** the user navigates between Phase 1 frontend routes
- **THEN** the newly rendered route content SHALL appear with a short, subtle transition.

#### Scenario: User opens a desktop editor
- **WHEN** a desktop-width user opens a create or edit route
- **THEN** the editor overlay and panel SHALL appear with a short transition
- **AND** the existing centered modal behavior SHALL be preserved.

#### Scenario: User opens a destructive confirmation
- **WHEN** the user initiates a delete action
- **THEN** the confirmation overlay and dialog SHALL appear with a short transition
- **AND** focus behavior and Escape/cancel behavior SHALL remain unchanged.

### Requirement: List and Card Update Transitions
Dockmark SHALL animate common list and card state changes in service navigation and management views.

#### Scenario: Navigation cards load or change
- **WHEN** home navigation cards become visible after loading or filtering
- **THEN** card appearance SHALL use a subtle shared list transition.

#### Scenario: Management records change
- **WHEN** service, category, or tag records are inserted, removed, or filtered
- **THEN** visible rows or mobile cards SHALL update with a subtle shared transition
- **AND** table and card layouts SHALL remain stable.

### Requirement: Feedback and Disclosure Transitions
Dockmark SHALL make transient feedback and mobile disclosures easier to follow.

#### Scenario: Feedback appears
- **WHEN** success, error, or info feedback becomes visible
- **THEN** the message SHALL appear with a short transition
- **AND** the message content and semantics SHALL remain unchanged.

#### Scenario: Mobile filters are toggled
- **WHEN** a mobile-width user opens or closes service filters
- **THEN** the filter controls SHALL disclose or hide with a short transition
- **AND** controls SHALL remain keyboard and screen-reader accessible.

### Requirement: Dynamic Editor Row Transitions
Dockmark SHALL animate dynamic service editor row changes without changing submitted data.

#### Scenario: User adds or removes an endpoint
- **WHEN** the user adds or removes a service endpoint row
- **THEN** the row change SHALL use a shared list transition
- **AND** primary endpoint selection and endpoint ordering semantics SHALL remain unchanged.
