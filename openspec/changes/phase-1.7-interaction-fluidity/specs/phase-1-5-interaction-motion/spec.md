# phase-1-5-interaction-motion Specification

## MODIFIED Requirements

### Requirement: Route and Panel Transitions
Dockmark SHALL make route and modal/editor transitions visually traceable without adding avoidable interaction delay or page-level layout jitter.

#### Scenario: User changes top-level routes
- **WHEN** the user navigates between Phase 1 frontend routes
- **THEN** the target route content SHALL replace the previous top-level route directly
- **AND** Dockmark SHALL NOT overlap old and new top-level route content with a page-level enter/leave transition.

#### Scenario: User opens or closes a desktop editor
- **WHEN** a desktop-width user opens or closes a create or edit route
- **THEN** the editor overlay and panel SHALL transition in or out before their route component is discarded
- **AND** the existing centered modal behavior SHALL be preserved.

#### Scenario: User opens a destructive confirmation
- **WHEN** the user initiates or dismisses a delete action
- **THEN** the confirmation backdrop SHALL fade independently from the dialog panel motion
- **AND** focus behavior and Escape/cancel behavior SHALL remain unchanged.
