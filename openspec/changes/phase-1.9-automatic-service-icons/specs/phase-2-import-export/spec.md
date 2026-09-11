# phase-2-import-export Specification

## ADDED Requirements

### Requirement: Managed icon assets are portable across Dockmark instances
Dockmark SHALL export and import service icons stored in private R2 without relying on instance-local R2 keys that do not exist on the destination instance.

#### Scenario: Export contains managed R2 icons
- **WHEN** a service with `iconType=r2` is exported
- **THEN** the asset-aware export schema SHALL include the referenced managed icon bytes and metadata in a deduplicated top-level asset collection
- **AND** the exported item SHALL retain a stable content-addressed reference to that asset
- **AND** the export SHALL NOT require the destination instance to access the source instance's R2 bucket.

#### Scenario: Export contains the same managed icon more than once
- **WHEN** multiple services reference the same content-addressed icon
- **THEN** the exported asset payload SHALL include those bytes only once.

#### Scenario: User imports a legacy schema-v1 document
- **WHEN** a valid existing Dockmark schema-v1 JSON document is imported after asset-aware exports are introduced
- **THEN** Dockmark SHALL continue to accept the legacy document according to existing Phase 2 semantics.

#### Scenario: User imports an asset-aware document
- **WHEN** a valid asset-aware Dockmark export is imported
- **THEN** Dockmark SHALL validate each managed asset's declared hash, byte length, and media type
- **AND** it SHALL store accepted assets in the destination R2 bucket before committing item references that depend on them
- **AND** a failed required asset validation/storage step SHALL prevent an import from leaving broken managed icon references.

#### Scenario: Asset-aware export exceeds configured safety limits
- **WHEN** the encoded document or embedded managed assets exceed version-specific import/export safety limits
- **THEN** Dockmark SHALL return an actionable error
- **AND** it SHALL NOT silently omit a referenced managed icon while claiming the export is portable.

### Requirement: Asset-aware exports remain secret-safe
Managed icon portability SHALL NOT weaken the existing rule that Dockmark exports contain no authentication secrets.

#### Scenario: Managed icon metadata is exported
- **WHEN** Dockmark serializes asset metadata
- **THEN** it SHALL include only icon identity, media/size metadata, and bytes needed to restore the asset
- **AND** it SHALL NOT include target-site cookies, Authorization headers, Dockmark sessions, browser credentials, or other fetched request credentials.
