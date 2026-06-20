## ADDED Requirements

### Requirement: Non-mutating validation gate
Dockmark SHALL provide a validation command that checks type safety, tests, lint rules, and builds without modifying tracked source files.

#### Scenario: Validation is run
- **WHEN** a developer runs the root validation command
- **THEN** linting SHALL run in check mode without auto-fix flags
- **AND** formatting or lint fixes SHALL require an explicit fix or format command.

### Requirement: Sanitized persistence conflict errors
Dockmark SHALL map persistence uniqueness conflicts to stable structured API errors without exposing raw database implementation details to clients.

#### Scenario: Unique constraint conflict occurs
- **WHEN** D1 rejects a create or update operation because of a uniqueness constraint
- **THEN** the Worker SHALL return HTTP 409 with `error.code` set to `conflict`
- **AND** the response body SHALL NOT include raw D1 messages such as table names, column names, SQL fragments, or `UNIQUE constraint failed`.

### Requirement: Atomic navigation mutation invalidation
Dockmark SHALL apply service navigation source mutations and navigation cache version invalidation in one D1 consistency boundary.

#### Scenario: Cache version invalidation fails during a mutation
- **WHEN** a category, tag, or service item mutation cannot advance the navigation cache version
- **THEN** the corresponding source data mutation SHALL NOT remain committed
- **AND** a later navigation read SHALL NOT depend on a stale cache version for changed source data.

### Requirement: Explicit Worker release gates
Dockmark SHALL document and configure Worker production release checks so deployment behavior does not depend on implicit local defaults.

#### Scenario: Production release is prepared
- **WHEN** a production Worker release is prepared
- **THEN** the release checklist SHALL include validation, OpenSpec validation, Wrangler binding type checks, and production dry-run deployment checks
- **AND** Worker observability SHALL be explicitly enabled with a configured sampling rate.

#### Scenario: Compatibility date is updated
- **WHEN** the Worker compatibility date changes
- **THEN** Worker runtime integration tests and the root validation gate SHALL pass before release.
