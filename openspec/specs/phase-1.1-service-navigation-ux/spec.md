# phase-1.1-service-navigation-ux Specification

## Purpose

Define Phase 1 user experience requirements for the Chinese default interface, responsive route-driven editors, mobile-friendly navigation, and management usability.

## Requirements

### Requirement: Chinese default interface

Dockmark SHALL present Phase 1 service navigation and management UI in Chinese by default.

#### Scenario: User opens the app shell

- **WHEN** the user opens the Dockmark Web UI
- **THEN** primary navigation labels SHALL be displayed in Chinese
- **AND** the UI SHALL NOT require a language switcher for this phase

#### Scenario: User manages navigation data

- **WHEN** the user opens service, category, or tag management views
- **THEN** page titles, form labels, button labels, endpoint kind labels, status labels, empty states, and common feedback messages SHALL be understandable in Chinese

### Requirement: Responsive route-driven create and edit flows

Dockmark SHALL use explicit create/edit routes that render appropriately for desktop and mobile viewports.

#### Scenario: Desktop user creates or edits a service

- **WHEN** a desktop-width user visits a service create or edit route
- **THEN** the service form SHALL appear in a vertically and horizontally centered modal over the service list context
- **AND** the modal SHALL provide clear save and cancel actions

#### Scenario: Mobile user creates or edits a service

- **WHEN** a mobile-width user visits a service create or edit route
- **THEN** the service form SHALL appear as a normal document-flow page
- **AND** it SHALL NOT rely on a fixed fullscreen dialog, locked body scrolling, or `100vh` height to remain usable

#### Scenario: User refreshes an edit route

- **WHEN** the user refreshes a create or edit route
- **THEN** the page SHALL remain directly addressable and reload the form state needed for that route

### Requirement: Service management usability

Dockmark SHALL provide clear service creation, editing, deletion, and list review interactions.

#### Scenario: User opens service management

- **WHEN** the user opens the service management view
- **THEN** the page SHALL show a scannable service list and a clear create-service action
- **AND** it SHALL NOT show a large always-on service form above the list

#### Scenario: User edits service endpoints

- **WHEN** the user edits a service
- **THEN** endpoint fields SHALL support labels, URLs, endpoint kind selection, primary endpoint selection, addition, and removal
- **AND** endpoint kind options SHALL be displayed with Chinese labels

#### Scenario: User deletes a service

- **WHEN** the user initiates service deletion
- **THEN** Dockmark SHALL require confirmation before deleting
- **AND** it SHALL show success or error feedback after the action

### Requirement: Category and tag management usability

Dockmark SHALL provide mobile-friendly category and tag management with create, edit, and delete flows.

#### Scenario: User manages categories on mobile

- **WHEN** the user opens category management on a mobile-width viewport
- **THEN** categories SHALL be shown in a mobile-friendly layout without requiring a wide table

#### Scenario: User edits a tag

- **WHEN** the user edits a tag name or slug
- **THEN** Dockmark SHALL persist the change through an authenticated API request
- **AND** navigation cache state SHALL be invalidated

#### Scenario: User deletes a category or tag

- **WHEN** the user initiates category or tag deletion
- **THEN** Dockmark SHALL require confirmation before deleting
- **AND** it SHALL show success or error feedback after the action

### Requirement: Mobile-friendly app navigation

Dockmark SHALL keep core navigation usable on narrow mobile viewports.

#### Scenario: User opens Dockmark on a narrow viewport

- **WHEN** available width is limited
- **THEN** the app shell navigation SHALL remain readable and tappable
- **AND** management actions SHALL remain reachable without horizontal page overflow

### Requirement: Phase 1 UX scope boundary

Phase 1 UX improvements SHALL NOT introduce later-phase backup, import/export, bookmark synchronization, or browser extension behavior.

#### Scenario: UX phase is completed

- **WHEN** the Phase 1 UX change is deployed
- **THEN** Dockmark SHALL remain focused on service navigation and management only
- **AND** no R2 backup, JSON import/export, browser bookmark import, or extension sync capability SHALL be required

### Requirement: Daily management shortcuts

Dockmark SHALL add small daily-use shortcuts to the existing Phase 1 service navigation UX without changing its responsive modal/page editing model.

#### Scenario: Usability improvements are deployed

- **WHEN** the Phase 1 usability change is deployed
- **THEN** desktop create/edit routes SHALL continue to render as centered modals
- **AND** mobile create/edit routes SHALL continue to render as normal document-flow pages
- **AND** service management SHALL include filtering, named confirmations, and endpoint quick templates
