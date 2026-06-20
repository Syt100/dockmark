# phase-1.4-management-maintainability Specification

## Purpose

Defines the maintainability contracts for Phase 1 management workflows, including reusable list helpers, direct editor record loading, typed form mapping, and shared form control coverage.

## Requirements

### Requirement: Reusable management list workflows

Dockmark SHALL provide shared frontend workflow helpers for repeated management list behavior while preserving page-specific domain rendering.

#### Scenario: Management list loads data

- **WHEN** a service, category, or tag management page loads its records
- **THEN** the page SHALL use a shared loading/error/reload workflow or equivalent helper
- **AND** the page SHALL still keep domain-specific filtering and row presentation explicit.

#### Scenario: Saved editor result is displayed

- **WHEN** a create or edit flow returns to a management list with a saved-state marker
- **THEN** the page SHALL show the appropriate success feedback through shared saved-flash handling
- **AND** it SHALL reload the affected list without requiring a browser refresh.

#### Scenario: Record is deleted

- **WHEN** a user confirms deletion from a management list
- **THEN** the page SHALL perform deletion through shared feedback and reload handling
- **AND** page-specific confirmation copy SHALL still include the affected record name where available.

### Requirement: Direct editor record loading

Dockmark SHALL support direct loading of a category or tag record for editor views.

#### Scenario: Category editor opens an existing category

- **WHEN** the category editor opens with a category ID
- **THEN** the web client SHALL request that category directly from the API
- **AND** the editor SHALL show a not-found error if the category does not exist.

#### Scenario: Tag editor opens an existing tag

- **WHEN** the tag editor opens with a tag ID
- **THEN** the web client SHALL request that tag directly from the API
- **AND** the editor SHALL show a not-found error if the tag does not exist.

#### Scenario: Single-record API returns data

- **WHEN** an authenticated user requests an existing category or tag by ID
- **THEN** the Worker SHALL return a response envelope consistent with create/update responses
- **AND** missing records SHALL return the shared not-found API error contract.

### Requirement: Typed editor form mapping

Dockmark SHALL keep editor model-to-form and form-to-input conversions explicit, typed, and reusable where they normalize data.

#### Scenario: API model is loaded into a form

- **WHEN** a service, category, or tag editor loads an existing record
- **THEN** nullable API fields SHALL be converted into editable form values consistently
- **AND** numeric fields SHALL remain numeric in form state.

#### Scenario: Form is submitted

- **WHEN** a service, category, or tag editor submits form state
- **THEN** empty optional text fields SHALL be converted consistently to `null` or omitted according to the shared input contract
- **AND** service endpoint order and selected tag IDs SHALL remain deterministic.

### Requirement: Shared form control coverage

Dockmark SHALL use shared form controls for common input behavior across management editors.

#### Scenario: Numeric field is edited

- **WHEN** an editor renders a numeric field such as category sort order
- **THEN** it SHALL use a shared control or shared control-supported path
- **AND** the value SHALL be passed to submit logic as a number rather than an accidental string.

#### Scenario: Common input attributes are needed

- **WHEN** an editor or auth form needs standard input attributes such as `autocomplete`, `minlength`, `name`, `type`, or `placeholder`
- **THEN** the shared control SHALL support those attributes without losing styling or accessibility behavior.

### Requirement: Phase 1.4 preserves user-facing workflows

Phase 1.4 SHALL improve maintainability without changing the visible service navigation management workflows.

#### Scenario: Refactor is complete

- **WHEN** Phase 1.4 is implemented
- **THEN** existing service, category, and tag list/editor routes SHALL remain available
- **AND** existing create, edit, delete, search, filter, and mobile editor behaviors SHALL remain functionally equivalent.

#### Scenario: Later phases remain deferred

- **WHEN** management maintainability work is complete
- **THEN** Dockmark SHALL NOT add import/export, bookmark import, browser extension sync, bookmark sync, auth provider changes, or Homelab credential storage as part of this phase.
