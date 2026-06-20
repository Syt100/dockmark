# phase-1.2-service-navigation-usability Specification

## Purpose

Define daily management usability requirements for service filtering, contextual confirmations, Chinese feedback, home empty-state actions, endpoint templates, and mobile form actions.

## Requirements

### Requirement: Service management filters

Dockmark SHALL let users narrow the service management list using common service attributes.

#### Scenario: User filters services

- **WHEN** the user selects category, status, tag, or enters a text query in service management
- **THEN** the service list SHALL show only matching services
- **AND** the page SHALL provide a way to clear filters

#### Scenario: Filters produce no matches

- **WHEN** service filters produce no matching services
- **THEN** Dockmark SHALL show an empty state that explains no services match the current filters

### Requirement: Named destructive confirmations

Dockmark SHALL include the affected resource name when asking users to confirm destructive management actions.

#### Scenario: User starts deleting a service

- **WHEN** the user initiates deleting a service
- **THEN** the confirmation text SHALL include the service name

#### Scenario: User starts deleting a category or tag

- **WHEN** the user initiates deleting a category or tag
- **THEN** the confirmation text SHALL include the category or tag name

### Requirement: Friendly Chinese management feedback

Dockmark SHALL present common management success and failure feedback in concise Chinese.

#### Scenario: Management action succeeds

- **WHEN** the user creates, updates, or deletes a service, category, or tag
- **THEN** Dockmark SHALL show a Chinese success message where the user remains on a management page

#### Scenario: Management action fails validation

- **WHEN** a common validation error occurs
- **THEN** Dockmark SHALL show a Chinese message that helps the user correct the problem

### Requirement: Home empty state action

Dockmark SHALL let users create their first service directly from the home empty state.

#### Scenario: Home has no services

- **WHEN** the home dashboard has no service entries
- **THEN** the empty state SHALL include a create-service action

### Requirement: Endpoint quick templates

Dockmark SHALL provide quick templates for common endpoint kinds in the service editor.

#### Scenario: User adds an endpoint from a template

- **WHEN** the user chooses a common endpoint template
- **THEN** Dockmark SHALL add an endpoint row with a localized label and matching endpoint kind
- **AND** the user SHALL still provide or edit the final URL

### Requirement: Mobile form action clarity

Dockmark SHALL keep mobile service form actions clear without using fullscreen fixed dialogs.

#### Scenario: Mobile user reaches the end of service editing

- **WHEN** the user reaches the service editor action area on a mobile-width viewport
- **THEN** save and cancel actions SHALL remain clear, tappable, and in normal document flow
