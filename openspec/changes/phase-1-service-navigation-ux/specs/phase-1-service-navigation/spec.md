## ADDED Requirements

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
