# phase-1-5-interaction-motion Specification

## MODIFIED Requirements

### Requirement: Route and Panel Transitions
Dockmark SHALL make route and modal/editor transitions visually traceable without adding avoidable interaction delay.

#### Scenario: User changes top-level routes
- **WHEN** the user navigates between Phase 1 frontend routes
- **THEN** the newly rendered route content SHALL begin appearing immediately without waiting for the previous route to finish its leave transition
- **AND** the top-level transition SHALL use a lightweight opacity crossfade without directional translate motion
- **AND** entering and leaving route content SHALL retain the same page content-box geometry during the overlap so the transition itself does not introduce a visible positional snap.

#### Scenario: User opens or closes a desktop editor
- **WHEN** a desktop-width user opens or closes a create or edit route
- **THEN** the editor overlay and panel SHALL transition in or out before their route component is discarded
- **AND** the existing centered modal behavior SHALL be preserved.

#### Scenario: User opens a destructive confirmation
- **WHEN** the user initiates or dismisses a delete action
- **THEN** the confirmation backdrop SHALL fade independently from the dialog panel motion
- **AND** focus behavior and Escape/cancel behavior SHALL remain unchanged.
