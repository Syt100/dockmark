## MODIFIED Requirements

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

