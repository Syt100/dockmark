## ADDED Requirements

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
