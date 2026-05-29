## ADDED Requirements

### Requirement: Theme Mode

The frontend SHALL support light mode, dark mode, and system preference for all Phase 1 pages.

#### Scenario: User toggles theme

- **WHEN** the user activates the theme toggle in the application shell
- **THEN** the visible page switches between light and dark styling without navigating away
- **AND** the selected preference is persisted for future visits

#### Scenario: System preference is used by default

- **WHEN** the user has not selected an explicit theme preference
- **THEN** the frontend uses the browser or operating system color scheme preference

### Requirement: Design Tokens

The frontend SHALL centralize common visual decisions behind shared design tokens instead of repeating raw color, spacing, radius, shadow, focus, and motion values across Phase 1 views.

#### Scenario: Shared visual tokens apply across pages

- **WHEN** the user visits the home, services, categories, tags, about, and editor pages
- **THEN** backgrounds, surfaces, text, muted text, borders, focus rings, spacing, radii, and hover states use the shared token system consistently

#### Scenario: Dark mode uses dedicated token values

- **WHEN** dark mode is active
- **THEN** surfaces, controls, tables, cards, chips, feedback messages, and editor shells use dark-mode token values rather than relying on light-mode colors

### Requirement: Shared UI Components

The frontend SHALL provide shared UI components or shared classes for recurring controls and display elements used by Phase 1 pages.

#### Scenario: Common controls render consistently

- **WHEN** buttons, link buttons, icon buttons, inputs, selects, textareas, search fields, badges, and feedback messages appear on any Phase 1 page
- **THEN** they use consistent sizing, spacing, radius, focus, disabled, hover, and theme-aware color behavior

#### Scenario: Primary emphasis is limited

- **WHEN** a page contains repeated row-level or card-level actions such as opening a service URL
- **THEN** those repeated actions use low-emphasis styling
- **AND** primary styling remains reserved for create, save, confirm, and selected navigation actions

### Requirement: Page Style Normalization

Phase 1 pages SHALL use consistent responsive layout density, surface treatment, and interaction states.

#### Scenario: Desktop pages use dense scanning layouts

- **WHEN** the user views services, categories, or tags on a desktop-width viewport
- **THEN** list content is presented with compact table-like rows, subtle hover highlighting, and no unnecessary card wrappers around each row

#### Scenario: Mobile pages use readable cards

- **WHEN** the user views services, categories, or tags on a mobile-width viewport
- **THEN** list content is presented as readable cards using the same token-backed surface, spacing, chip, and action styles

#### Scenario: Editor pages remain responsive

- **WHEN** the user opens a create or edit page on desktop or mobile
- **THEN** the editor preserves the existing desktop modal and mobile document-flow behavior
- **AND** form controls, section spacing, borders, and action bars follow the shared visual system

### Requirement: Phase Exclusions

This change SHALL NOT alter Dockmark data semantics, API behavior, authentication behavior, import/export behavior, browser extension sync, or credential storage boundaries.

#### Scenario: Backend behavior remains unchanged

- **WHEN** this change is implemented
- **THEN** Worker routes, D1 schema, KV cache semantics, auth adapters, import/export behavior, sync behavior, and credential safety rules remain unchanged
