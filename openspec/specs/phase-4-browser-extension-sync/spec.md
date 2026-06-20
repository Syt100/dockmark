## Purpose

Define the future browser extension synchronization milestone, limited to one-way browser-to-Dockmark sync with paired clients and token-based authentication.

## Requirements

### Requirement: Browser extension sync boundary

Dockmark SHALL support browser-to-Dockmark bookmark synchronization through a browser extension, initially as one-way sync only.

#### Scenario: Sync direction is evaluated

- **WHEN** Phase 4 sync is implemented
- **THEN** bookmarks SHALL flow from browser to Dockmark
- **AND** Dockmark SHALL NOT write changes back to the browser in this phase

### Requirement: Device pairing

Dockmark SHALL pair browser extensions with the server using short-lived pairing codes and per-client sync tokens.

#### Scenario: User starts pairing

- **WHEN** an authenticated user creates a pairing code in the web UI
- **THEN** Dockmark SHALL generate a short-lived code
- **AND** only a hash of the code SHALL be stored server-side

#### Scenario: Extension finishes pairing

- **WHEN** the extension submits a valid site URL and pairing code
- **THEN** Dockmark SHALL issue a client ID and sync token
- **AND** only a hash of the sync token SHALL be stored server-side
- **AND** the token SHALL be shown to the extension only once

### Requirement: Full bookmark synchronization

Dockmark SHALL accept full bookmark tree snapshots from paired browser clients.

#### Scenario: Extension submits full snapshot

- **WHEN** the extension sends a snapshot from the browser bookmarks API
- **THEN** Dockmark SHALL authenticate the sync token
- **AND** it SHALL upsert raw browser bookmark nodes
- **AND** it SHALL mark previously seen but missing nodes as deleted for that client
- **AND** it SHALL update normalized bookmarks and bookmark sources

### Requirement: Incremental operation synchronization

Dockmark SHALL accept idempotent incremental bookmark operations after full sync is working.

#### Scenario: Extension retries an operation

- **WHEN** the same operation ID is received more than once for a client
- **THEN** Dockmark SHALL process it at most once
- **AND** the response SHALL be safe for retrying clients

### Requirement: Sync client management

Dockmark SHALL provide web UI and API support for listing, disabling, and deleting sync clients.

#### Scenario: User disables a sync client

- **WHEN** a client is disabled
- **THEN** future sync requests from that client SHALL be rejected
- **AND** existing imported bookmark data SHALL remain available unless explicitly deleted

### Requirement: Phase 4 excludes bidirectional sync

Phase 4 SHALL NOT support server-to-browser bookmark writes, conflict resolution across browsers, managed-folder mirroring, or automatic deletion in the user's browser.

#### Scenario: Browser bookmark data differs from Dockmark

- **WHEN** a user edits imported bookmark metadata in Dockmark
- **THEN** those edits SHALL NOT be pushed back to the browser in Phase 4

### Requirement: Extension package foundation

Dockmark SHALL provide a buildable browser extension foundation before implementing bookmark synchronization.

#### Scenario: Extension is built

- **WHEN** the extension build command runs
- **THEN** it SHALL emit a Manifest V3 `manifest.json`
- **AND** it SHALL emit a background script referenced by that manifest.

#### Scenario: Extension permissions are reviewed

- **WHEN** the foundation extension manifest is inspected
- **THEN** it SHALL avoid host permissions and bookmark permissions until pairing and sync behavior are implemented
- **AND** it SHALL identify itself as a Dockmark extension.

### Requirement: Extension foundation excludes sync behavior

Dockmark SHALL keep browser bookmark reading, pairing, token storage, and server synchronization out of the extension foundation milestone.

#### Scenario: Foundation extension starts

- **WHEN** the extension background script loads
- **THEN** it SHALL initialize only static extension metadata
- **AND** it SHALL NOT read browser bookmarks, store sync tokens, call Dockmark APIs, or write browser bookmark data.
