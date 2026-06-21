## MODIFIED Requirements

### Requirement: Dockmark JSON export

Dockmark SHALL export all Phase 1 service navigation data as a portable JSON document.

#### Scenario: User exports data

- **WHEN** the user requests a JSON export
- **THEN** the API SHALL return a JSON document with top-level `schemaVersion`, `generatedAt`, `categories`, `tags`, and `items` fields
- **AND** each exported item SHALL include its endpoints inline
- **AND** each exported item SHALL include its tag relationships as tag IDs
- **AND** the export SHALL include a schema version and generated timestamp
- **AND** the export SHALL NOT include authentication tokens or secrets

#### Scenario: Export preserves portable record identity

- **WHEN** service navigation data is exported
- **THEN** the document SHALL include stable record IDs for categories, tags, items, and endpoints
- **AND** it SHALL include available `createdAt` and `updatedAt` timestamps for records that have them
- **AND** it SHALL NOT expose raw database-only join rows as a separate top-level export collection

### Requirement: Dockmark JSON import

Dockmark SHALL import Dockmark JSON documents that match a supported schema version.

#### Scenario: User imports valid JSON

- **WHEN** a valid Dockmark JSON document is confirmed for import
- **THEN** the API SHALL validate the schema version and required fields
- **AND** it SHALL preserve imported record IDs and timestamps where the schema supports them
- **AND** it SHALL write imported data to D1 in an all-or-nothing transaction or transaction-equivalent sequence
- **AND** it SHALL invalidate affected KV cache state

#### Scenario: User imports invalid JSON

- **WHEN** an import document is malformed, unsupported, or violates validation rules
- **THEN** the API SHALL reject it with actionable validation errors
- **AND** existing data SHALL remain unchanged

#### Scenario: User previews an import

- **WHEN** a user uploads a Dockmark JSON document for review
- **THEN** the API SHALL validate the document without writing data
- **AND** it SHALL return a summary of categories, tags, items, and endpoints that would be imported
- **AND** it SHALL return actionable validation or conflict errors when the document cannot be imported

#### Scenario: Import exceeds safety limits

- **WHEN** an import document exceeds the supported payload size or record count limits
- **THEN** the API SHALL reject it with actionable validation errors
- **AND** it SHALL NOT write any data

### Requirement: Import conflict behavior

Dockmark SHALL define deterministic behavior for duplicate slugs, service IDs, endpoint IDs, and tag names during import.

#### Scenario: Additive import detects conflicts

- **WHEN** the user imports using the default additive mode
- **THEN** the import SHALL reject the whole document if an imported category ID, category slug, tag ID, tag name, tag slug, item ID, or endpoint ID already exists
- **AND** existing data SHALL remain unchanged

#### Scenario: Replace-all import restores a full export

- **WHEN** the user imports using an explicit replace-all mode
- **THEN** Dockmark SHALL delete existing Phase 1 service navigation data before inserting the imported document
- **AND** it SHALL import the replacement data using the IDs, relationships, and timestamps from the document
- **AND** any failure during replacement SHALL leave the previous data unchanged

#### Scenario: User chooses an import mode

- **WHEN** a user starts an import
- **THEN** the UI SHALL require a mode selection of additive or replace-all
- **AND** additive SHALL be the default mode
- **AND** replace-all SHALL be presented as destructive and require explicit confirmation

#### Scenario: User confirms replace-all import

- **WHEN** a user previews a replace-all import
- **THEN** the UI SHALL require the user to type a confirmation phrase before enabling the final import action
- **AND** the confirmation area SHALL show the current data counts that would be replaced

### Requirement: Export and import UI

Dockmark SHALL provide a UI for exporting and importing Dockmark JSON.

#### Scenario: User opens import/export page

- **WHEN** the user visits the import/export view
- **THEN** they SHALL be able to download a JSON export
- **AND** they SHALL be able to upload a JSON import file, choose an import mode, preview the import summary, and review validation errors before writing data
