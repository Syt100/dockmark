# phase-4.1-extension-assisted-service-icons Specification

## ADDED Requirements

### Requirement: Extension-assisted icon discovery is user initiated
Dockmark SHALL allow a paired browser extension to discover service icons from the user's device only after an explicit user action for a specific service endpoint.

#### Scenario: User requests extension-assisted discovery
- **WHEN** an authenticated user chooses extension-assisted icon discovery for a service endpoint
- **THEN** Dockmark SHALL create or otherwise establish a short-lived discovery request tied to that target and editor context
- **AND** the paired extension SHALL NOT begin arbitrary background scanning of other services or browser activity.

#### Scenario: Discovery request expires or is cancelled
- **WHEN** the user cancels the request or its short lifetime expires
- **THEN** the extension SHALL no longer be able to submit that request's result
- **AND** the current service icon SHALL remain unchanged.

### Requirement: Extension host access is runtime and least privilege
Dockmark's extension SHALL request target host permission at runtime for the exact HTTP(S) origin needed by the approved icon discovery action.

#### Scenario: Target permission is requested
- **WHEN** the extension is ready to fetch a target origin
- **THEN** it SHALL show or otherwise bind the permission request to the exact origin selected by the user
- **AND** it SHALL request only that origin through runtime optional host permissions
- **AND** icon discovery SHALL NOT require permanent `<all_urls>` host permission.

#### Scenario: User denies target permission
- **WHEN** the user denies the runtime host permission
- **THEN** extension-assisted discovery SHALL stop with a normal permission-denied result
- **AND** Dockmark SHALL NOT silently retry the target through Worker-side discovery.

#### Scenario: Target redirects to another origin
- **WHEN** a target response redirects to an origin that is not already approved
- **THEN** the extension SHALL NOT widen its access silently
- **AND** following that redirect SHALL require validation and any additional explicit runtime permission needed for the new origin.

### Requirement: Extension-assisted discovery supports local browser-reachable services
Dockmark SHALL use the extension path to cover targets that ordinary Dockmark page JavaScript or the Cloudflare Worker may not be able to read, including LAN, Tailscale, CORS-restricted, and HTTP-only services.

#### Scenario: User approves a LAN or Tailscale origin
- **WHEN** the user's device can reach the approved HTTP(S) target and runtime host permission is granted
- **THEN** the extension SHALL be allowed to inspect bounded target HTML/icon metadata and candidate icon bytes from that device
- **AND** Phase 1.9 Worker private-network SSRF denial rules SHALL NOT block the extension's local fetch.

#### Scenario: Target uses an unsupported scheme
- **WHEN** a requested target uses `file:`, browser-internal, extension, data, or another non-HTTP(S) scheme
- **THEN** the extension SHALL reject the discovery request.

### Requirement: Extension discovery reuses the managed icon pipeline
Dockmark SHALL reuse Phase 1.9 candidate selection and managed icon storage semantics instead of creating an extension-specific icon storage format.

#### Scenario: Extension finds icon candidates
- **WHEN** the extension can read the approved target
- **THEN** it SHALL evaluate declared favicon, apple-touch-icon, manifest, and bounded conventional candidates using shared Phase 1.9 ranking and limits.

#### Scenario: Extension uploads a candidate
- **WHEN** the user/extension selects an acceptable icon candidate
- **THEN** only the icon bytes and bounded source metadata SHALL be uploaded to Dockmark
- **AND** the server SHALL validate and content-address the asset through the existing managed R2 icon pipeline
- **AND** the result SHALL be previewed before the service item is changed.

### Requirement: Extension icon discovery is credential-free by default
Dockmark SHALL NOT use extension-assisted icon discovery as a mechanism for extracting authenticated target-site content.

#### Scenario: Extension fetches a target
- **WHEN** the extension performs an icon discovery request
- **THEN** it SHALL omit target-site credentials by default
- **AND** it SHALL NOT forward password-manager data, Dockmark credentials, browser session tokens, or arbitrary Authorization headers.

#### Scenario: Extension reports a result
- **WHEN** discovery completes
- **THEN** the extension SHALL NOT upload the target page HTML or arbitrary response bodies
- **AND** it SHALL send only the request identity, icon bytes, resolved source URL, media metadata, and bounded diagnostics needed for the icon preview.

### Requirement: Extension-assisted icon discovery is deferred from Phase 1.9 implementation
The Phase 4.1 extension implementation SHALL remain outside the initial Phase 1.9 automatic service icon delivery even though both phases are specified together.

#### Scenario: Phase 1.9 is implemented first
- **WHEN** browser-side and Worker-side automatic icons are delivered without Phase 4.1
- **THEN** Dockmark SHALL remain functional with those two retrieval modes
- **AND** no new browser extension host permissions or extension icon-fetch runtime behavior SHALL be required.
