# phase-1-service-navigation Specification

## ADDED Requirements

### Requirement: Automatic service icon discovery is explicit
Dockmark SHALL let an authenticated user explicitly discover a service icon from a chosen service endpoint without silently changing the service icon or leaking an internal target to another retrieval mode.

#### Scenario: User chooses an icon source endpoint
- **WHEN** the service editor contains one or more endpoints
- **THEN** Dockmark SHALL let the user choose which endpoint is used for icon discovery
- **AND** the primary endpoint SHALL be selected by default.

#### Scenario: User chooses a retrieval mode
- **WHEN** the user requests automatic icon discovery
- **THEN** Dockmark SHALL expose browser-side and Worker-side discovery as separate explicit actions
- **AND** failure of one mode SHALL NOT automatically invoke the other mode.

#### Scenario: Discovery fails
- **WHEN** no acceptable icon is discovered or storing the discovered icon fails
- **THEN** Dockmark SHALL preserve the icon currently present in the service form
- **AND** it SHALL show an actionable failure state.

### Requirement: Icon discovery uses bounded deterministic candidates
Dockmark SHALL discover site-declared icon metadata before conventional fallback paths and SHALL evaluate only a bounded set of candidates.

#### Scenario: Site declares icon metadata
- **WHEN** readable HTML declares favicon, shortcut icon, apple-touch-icon, or a web manifest with icon entries
- **THEN** Dockmark SHALL resolve declared candidate URLs relative to their declaring document
- **AND** it SHALL rank candidates deterministically using declaration priority and available quality metadata.

#### Scenario: Site exposes no usable declared icon
- **WHEN** declared metadata is unavailable or unusable
- **THEN** Dockmark MAY probe a bounded conventional set such as `/favicon.ico`, `/favicon.png`, `/favicon.svg`, and `/apple-touch-icon.png`
- **AND** it SHALL NOT crawl unrelated page assets.

### Requirement: Browser-side icon discovery is best-effort and privacy-preserving
Dockmark SHALL support icon discovery from the user's browser without automatically forwarding a failed target URL to the Dockmark Worker.

#### Scenario: Browser can read target metadata and icon bytes
- **WHEN** browser CORS and network policy allow the selected endpoint and candidate bytes to be read
- **THEN** Dockmark SHALL allow the discovered bytes to be uploaded to the managed icon store
- **AND** the accepted service icon SHALL use managed R2 storage.

#### Scenario: Browser can render but cannot read candidate bytes
- **WHEN** an icon URL loads as an image but browser CORS prevents Dockmark from reading its bytes
- **THEN** Dockmark MAY offer that external URL as a direct `url` icon candidate
- **AND** it SHALL identify that the icon remains externally hosted.

#### Scenario: Browser access is blocked
- **WHEN** CORS, mixed-content, Private Network Access, certificate, or browser policy prevents discovery
- **THEN** Dockmark SHALL report browser discovery as unavailable for that target
- **AND** it SHALL NOT silently invoke Worker discovery.

### Requirement: Worker-side icon discovery is SSRF constrained
Dockmark SHALL treat server-side icon discovery as an SSRF-sensitive authenticated capability limited to public HTTP(S) destinations.

#### Scenario: Worker receives an unsupported or credential-bearing URL
- **WHEN** the requested source is not HTTP(S) or contains embedded URL credentials
- **THEN** the Worker SHALL reject the discovery request before external fetching.

#### Scenario: Worker receives an obviously local destination
- **WHEN** the target uses loopback, unspecified, private, link-local, or another explicitly denied literal/local host form
- **THEN** the Worker SHALL reject the target
- **AND** the UI SHOULD direct the user toward browser or later extension-assisted discovery.

#### Scenario: Target redirects
- **WHEN** an allowed public target returns a redirect
- **THEN** the Worker SHALL validate the redirect destination before following it
- **AND** it SHALL enforce a small maximum redirect count.

#### Scenario: Worker fetches target content
- **WHEN** server-side discovery performs external requests
- **THEN** Dockmark SHALL NOT forward the user's Dockmark Cookie, Authorization header, session credentials, or target-site credentials
- **AND** HTML, manifest, candidate count, icon bytes, and request duration SHALL be bounded by explicit limits.

### Requirement: Managed service icons use private R2 storage
Dockmark SHALL persist readable discovered icon bytes as private, content-addressed R2 assets and use the existing `r2` icon type for item references.

#### Scenario: A managed icon is stored
- **WHEN** Dockmark accepts icon bytes for managed storage
- **THEN** it SHALL validate the bytes and allowed media type
- **AND** it SHALL compute a SHA-256 content hash
- **AND** it SHALL store the object under a content-addressed key such as `icons/sha256/<hash>.<extension>`
- **AND** the service form SHALL reference the object using `iconType=r2` and the managed object key.

#### Scenario: Same icon bytes are stored more than once
- **WHEN** two discovery attempts produce identical accepted icon bytes
- **THEN** Dockmark SHALL be able to reuse the same content-addressed object rather than require duplicate R2 objects.

#### Scenario: Managed icon is rendered
- **WHEN** a service has `iconType=r2`
- **THEN** Dockmark SHALL serve the referenced icon through an authenticated Dockmark asset route backed by private R2
- **AND** it SHALL use immutable cache semantics appropriate for content-addressed keys
- **AND** it SHALL render the existing generated fallback if the managed object is unavailable.

#### Scenario: Potentially active image content is received
- **WHEN** an uploaded or fetched format could execute active same-origin content if served directly, including unsanitized SVG
- **THEN** Dockmark SHALL reject it from managed storage or process it through a separately reviewed sanitization path before same-origin serving.

### Requirement: Automatic icon discovery does not mutate service data until accepted
Dockmark SHALL separate discovery/storage from updating the service record.

#### Scenario: Candidate is discovered
- **WHEN** browser-side or Worker-side discovery succeeds
- **THEN** the editor SHALL preview the candidate and its source information
- **AND** the service icon fields SHALL change only when the user accepts or selects the discovered candidate.
