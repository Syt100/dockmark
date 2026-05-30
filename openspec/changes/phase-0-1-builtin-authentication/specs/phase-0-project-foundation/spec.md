## MODIFIED Requirements

### Requirement: Adapter-based authentication foundation
Dockmark SHALL define authentication behind an application-level adapter so built-in authentication is the default production mode and other production authentication mechanisms can be added without changing business logic.

#### Scenario: Built-in auth is used
- **WHEN** Dockmark is deployed without an external identity provider
- **THEN** the Worker SHALL authenticate web UI and normal API requests through the built-in auth adapter
- **AND** application services SHALL consume a normalized authenticated user context instead of reading auth provider details directly.

#### Scenario: Future OIDC auth is added
- **WHEN** Dockmark later supports standard OIDC login
- **THEN** the authentication implementation SHALL be replaceable without changing service navigation, import/export, bookmark import, or sync business logic.

#### Scenario: Future Cloudflare Access hardening is added
- **WHEN** Dockmark later supports Cloudflare Access as a production adapter
- **THEN** the adapter SHALL validate the Access JWT before producing a normalized authenticated user context
- **AND** application services SHALL remain independent from raw Access headers.

#### Scenario: Local development runs
- **WHEN** the application runs in local development
- **THEN** it SHALL provide a documented development auth adapter or mock user path
- **AND** that path SHALL NOT be enabled silently in production.
