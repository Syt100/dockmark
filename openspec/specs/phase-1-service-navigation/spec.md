## Purpose

Define the first usable Dockmark product milestone: a Homelab service dashboard with categories, service items, endpoints, tags, safe credential hints, and cached home navigation.

## Requirements

### Requirement: Service navigation data model

Dockmark SHALL model Homelab navigation with categories, service items, service endpoints, tags, and item-tag relationships.

#### Scenario: Service schema is migrated

- **WHEN** Phase 1 migrations are applied
- **THEN** D1 SHALL contain tables for categories, items, endpoints, tags, and item_tags
- **AND** endpoints SHALL support multiple addresses per service, including public, LAN, Tailscale, admin, backup, docs, and API kinds

#### Scenario: A service has a primary URL

- **WHEN** a service item is rendered in navigation
- **THEN** the primary address SHALL be derived from an endpoint marked as primary
- **AND** service URL fields such as `primary_url` and `internal_url` SHALL NOT be duplicated on `items`
- **AND** all service addresses SHALL be stored in `endpoints`

#### Scenario: Endpoint primary state is changed

- **WHEN** an endpoint is marked as the primary endpoint for a service
- **THEN** no other endpoint for the same service SHALL remain primary
- **AND** every active service SHALL have exactly one primary endpoint before it appears in home navigation

### Requirement: Service CRUD API

Dockmark SHALL expose authenticated API endpoints for managing service navigation data.

#### Scenario: A service is created

- **WHEN** a valid create request includes name, category, endpoints, tags, icon data, and credential hint
- **THEN** the Worker SHALL validate the payload
- **AND** it SHALL write the service and related records to D1 using parameter binding
- **AND** it SHALL invalidate navigation cache state

#### Scenario: A service is updated or deleted

- **WHEN** an authenticated user updates or deletes a service
- **THEN** D1 SHALL remain referentially consistent
- **AND** navigation cache state SHALL be invalidated

### Requirement: Category and tag management

Dockmark SHALL support basic category and tag management for grouping and filtering services.

#### Scenario: Categories are listed

- **WHEN** the frontend requests categories
- **THEN** the API SHALL return categories sorted by sort order and name

#### Scenario: Tags are listed

- **WHEN** the frontend requests tags
- **THEN** the API SHALL return tags with stable IDs, names, and slugs

### Requirement: Home navigation view

Dockmark SHALL provide a home navigation API and UI optimized for opening Homelab services quickly.

#### Scenario: Home navigation is loaded

- **WHEN** the user opens the app home page
- **THEN** services SHALL be grouped by category
- **AND** each service card SHALL show name, icon, primary endpoint, available alternate endpoints, tags, and credential hint if present

#### Scenario: User searches services

- **WHEN** the user enters a search query
- **THEN** matching services SHALL be found by name, description, endpoint URL, category, and tag

### Requirement: Credential safety boundary

Dockmark SHALL store only credential lookup hints and SHALL NOT store secrets.

#### Scenario: User enters credential guidance

- **WHEN** a service form includes account-related text
- **THEN** the application SHALL label the field as a Vaultwarden or credential lookup hint
- **AND** the application SHALL NOT provide username, password, token, API key, OTP seed, or session cookie fields

### Requirement: Navigation cache

Dockmark SHALL cache the home navigation response in KV while treating D1 as the only source of truth.

#### Scenario: Navigation cache miss occurs

- **WHEN** `/api/nav` has no valid KV entry
- **THEN** the Worker SHALL read from D1, assemble the navigation payload, write it to KV, and return the payload

#### Scenario: Navigation data changes

- **WHEN** service, category, endpoint, or tag data changes
- **THEN** the Worker SHALL invalidate navigation cache through a versioned key or equivalent deterministic strategy

### Requirement: Phase 1 excludes bookmark synchronization

Phase 1 SHALL NOT require browser extension sync, bookmarks.html import, R2 assets, screenshots, or bidirectional browser bookmark updates.

#### Scenario: Phase 1 is deployed

- **WHEN** only Phase 1 functionality is enabled
- **THEN** Dockmark SHALL still be useful as a Homelab service dashboard

### Requirement: Tag update API

Dockmark SHALL expose an authenticated API endpoint for updating existing tags.

#### Scenario: A tag is updated

- **WHEN** an authenticated user submits a valid tag update
- **THEN** the Worker SHALL validate the payload
- **AND** it SHALL update the tag name and slug in D1 using parameter binding
- **AND** it SHALL invalidate navigation cache state

#### Scenario: A tag update targets a missing tag

- **WHEN** an authenticated user updates a tag ID that does not exist
- **THEN** the Worker SHALL return a not found response
- **AND** existing tag data SHALL remain unchanged

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

### Requirement: Service icons support multiple display modes

Dockmark SHALL support service icon display modes for emoji/text, direct image URL, and primary-endpoint favicon while keeping service navigation usable when icon assets are missing or fail to load.

#### Scenario: Service icon is rendered in navigation

- **WHEN** a service appears on the home navigation view or service management view
- **THEN** Dockmark SHALL render the service icon in a fixed-size visual slot
- **AND** the service name and surrounding row/card layout SHALL remain stable regardless of icon mode

#### Scenario: Favicon mode is selected

- **WHEN** a service has `iconType` set to `favicon`
- **THEN** Dockmark SHALL derive the favicon candidate from the service primary endpoint origin
- **AND** Dockmark SHALL render a generated fallback if no primary endpoint origin can be derived or the favicon image fails to load

#### Scenario: Direct image URL mode is selected

- **WHEN** a service has `iconType` set to `url`
- **THEN** Dockmark SHALL render the icon from the stored image URL
- **AND** Dockmark SHALL render a generated fallback if the image fails to load

#### Scenario: Emoji mode is selected

- **WHEN** a service has `iconType` set to `emoji`
- **THEN** Dockmark SHALL render the stored emoji or short text icon when present
- **AND** Dockmark SHALL render a generated fallback when the stored icon is empty

### Requirement: Service icon editing preserves icon type

Dockmark SHALL allow service editors to choose the service icon display mode and SHALL persist the selected icon type through the existing service item API contract.

#### Scenario: Service icon is edited

- **WHEN** a user creates or edits a service
- **THEN** the editor SHALL provide controls for emoji/text, direct image URL, and primary-endpoint favicon modes
- **AND** the editor SHALL submit both `icon` and `iconType` according to the selected mode

#### Scenario: Service icon input is invalid

- **WHEN** a service create or update payload uses `iconType` set to `url` with a non-URL icon value
- **THEN** Dockmark SHALL reject the payload through shared validation before persistence

#### Scenario: Deferred icon modes are present

- **WHEN** a service has an unsupported or deferred icon mode such as R2 or simple-icons
- **THEN** Dockmark SHALL avoid broken visual output
- **AND** Dockmark SHALL keep later-phase R2 upload and branded icon registry behavior out of Phase 1.6
