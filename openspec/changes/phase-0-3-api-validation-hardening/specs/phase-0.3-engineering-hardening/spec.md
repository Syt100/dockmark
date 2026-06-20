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
