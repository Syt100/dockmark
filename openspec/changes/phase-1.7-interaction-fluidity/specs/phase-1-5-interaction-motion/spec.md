# phase-1-5-interaction-motion Specification

## MODIFIED Requirements

### Requirement: Route and Panel Transitions
Dockmark SHALL make route and modal/editor transitions visually traceable without adding avoidable interaction delay or page-level layout jitter.

#### Scenario: User changes top-level routes
- **WHEN** the user navigates between Phase 1 frontend routes
- **THEN** the target route content SHALL replace the previous top-level route directly
- **AND** Dockmark SHALL NOT overlap old and new top-level route content with a page-level enter/leave transition
- **AND** obsolete page-level route transition styles SHALL NOT remain as active interaction behavior
- **AND** the active navigation item SHALL provide immediate color/background feedback.

#### Scenario: User opens or closes a desktop editor
- **WHEN** a desktop-width user opens or closes a create or edit route
- **THEN** the editor overlay and panel SHALL transition in or out before their route component is discarded
- **AND** close button, Escape, backdrop, cancel, and successful-save exits SHALL use the same leave-before-navigation behavior
- **AND** the existing centered modal behavior SHALL be preserved.

#### Scenario: User opens a destructive confirmation
- **WHEN** the user initiates or dismisses a delete action
- **THEN** the confirmation backdrop SHALL fade independently from the dialog panel motion
- **AND** focus behavior and Escape/cancel behavior SHALL remain unchanged.

### Requirement: Stable Management Feedback
Dockmark SHALL keep management pages visually stable during loading, refresh, and record mutations.

#### Scenario: User first opens a management page
- **WHEN** service, category, or tag data is loading for the first time
- **THEN** Dockmark SHALL render a list-shaped skeleton with reserved vertical space
- **AND** SHALL NOT replace the expected list region with only a single short loading message.

#### Scenario: Existing management data refreshes
- **WHEN** a management page already has loaded records and begins a later refresh
- **THEN** existing records SHALL remain rendered while the request is pending
- **AND** a compact refresh status SHALL indicate background activity.

#### Scenario: Management refreshes resolve out of order
- **WHEN** multiple management-list loads are in flight and an older request resolves after a newer request
- **THEN** only the newest request SHALL update rendered records or load errors
- **AND** the older request SHALL NOT clear loading or refresh state owned by the newer request.

#### Scenario: User deletes a management record
- **WHEN** the delete request succeeds
- **THEN** the deleted record SHALL be removed from local rendered state without waiting for the follow-up fetch
- **AND** Dockmark SHALL perform a non-blocking refresh to reconcile with server state
- **AND** the entering or leaving record MAY animate locally
- **AND** remaining records SHALL NOT use move interpolation when their positions change.

### Requirement: Immediate Interaction Feedback
Dockmark SHALL provide lightweight feedback for frequently used navigation and controls.

#### Scenario: User presses a shared action control
- **WHEN** the user actively presses a shared button, link-button, or icon button
- **THEN** the control SHALL provide a subtle active-state response
- **AND** reduced-motion preferences SHALL suppress scale-based feedback.

#### Scenario: Application becomes idle after startup
- **WHEN** Dockmark has mounted and primary lazy routes have not yet been visited
- **THEN** Dockmark SHALL schedule loading of the primary route code chunks during browser idle time
- **AND** a delayed fallback SHALL be used when the browser does not support idle callbacks
- **AND** this preload SHALL NOT itself request management data.
