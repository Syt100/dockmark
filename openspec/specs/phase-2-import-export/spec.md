## Purpose
Define manual Dockmark JSON import and export so users can back up, restore, and move service navigation data without requiring R2 or scheduled backups.

## Requirements

### Requirement: Dockmark JSON export
Dockmark SHALL export all Phase 1 service navigation data as a portable JSON document.

#### Scenario: User exports data
- **WHEN** the user requests a JSON export
- **THEN** the API SHALL return categories, items, endpoints, tags, and item-tag relationships
- **AND** the export SHALL include a schema version and generated timestamp
- **AND** the export SHALL NOT include authentication tokens or secrets

### Requirement: Dockmark JSON import
Dockmark SHALL import Dockmark JSON documents that match a supported schema version.

#### Scenario: User imports valid JSON
- **WHEN** a valid Dockmark JSON document is uploaded
- **THEN** the API SHALL validate the schema version and required fields
- **AND** it SHALL write imported data to D1 in a consistent transaction or transaction-equivalent sequence
- **AND** it SHALL invalidate affected KV cache state

#### Scenario: User imports invalid JSON
- **WHEN** an import document is malformed, unsupported, or violates validation rules
- **THEN** the API SHALL reject it with actionable validation errors
- **AND** existing data SHALL remain unchanged

### Requirement: Import conflict behavior
Dockmark SHALL define deterministic behavior for duplicate slugs, service IDs, endpoint IDs, and tag names during import.

#### Scenario: Imported data conflicts with existing data
- **WHEN** an import contains records that already exist
- **THEN** the API SHALL either merge, overwrite, or reject according to an explicit import mode selected by the user
- **AND** the default mode SHALL avoid destructive overwrites

### Requirement: Export and import UI
Dockmark SHALL provide a UI for exporting and importing Dockmark JSON.

#### Scenario: User opens import/export page
- **WHEN** the user visits the import/export view
- **THEN** they SHALL be able to download a JSON export
- **AND** they SHALL be able to upload a JSON import file and review validation errors

### Requirement: Phase 2 backup boundary
Phase 2 SHALL support manual JSON import/export only and SHALL NOT require R2, automatic scheduled backups, encrypted backups, or backup retention policies.

#### Scenario: R2 is not configured
- **WHEN** the user exports data
- **THEN** the application SHALL still provide a direct JSON download
