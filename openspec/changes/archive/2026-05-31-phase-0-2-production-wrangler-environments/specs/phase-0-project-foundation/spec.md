## MODIFIED Requirements

### Requirement: Cloudflare-first runtime baseline
Dockmark SHALL target Cloudflare Workers as the backend runtime and Workers Assets as the web UI hosting path.

#### Scenario: Worker development server starts
- **WHEN** the Worker app is run locally
- **THEN** it SHALL expose a health endpoint that returns a successful response
- **AND** it SHALL be able to serve the built web UI through the configured assets binding

#### Scenario: Deployment configuration is present
- **WHEN** Wrangler reads the project configuration
- **THEN** it SHALL define the Worker entry point, compatibility date, web assets directory, D1 binding, and KV binding
- **AND** R2 SHALL NOT be required for the baseline deployment

#### Scenario: Production Wrangler environment is explicit
- **WHEN** Dockmark is deployed to Cloudflare production
- **THEN** deployment SHALL use a named production Wrangler environment
- **AND** production bindings SHALL point at production D1 and KV resources rather than local development placeholders
- **AND** production variables SHALL use `AUTH_MODE=builtin`
- **AND** production bootstrap secrets such as `SETUP_TOKEN` SHALL NOT be committed to `wrangler.jsonc`

### Requirement: Configuration and environment boundaries
Dockmark SHALL separate deploy-time Cloudflare bindings from application-level settings.

#### Scenario: Application reads environment bindings
- **WHEN** the Worker handles a request
- **THEN** it SHALL access D1 and KV through typed bindings
- **AND** it SHALL fail with a clear error if a required binding is missing

#### Scenario: Optional features are disabled
- **WHEN** optional bindings such as R2 are not configured
- **THEN** the application SHALL still run with the Phase 1 through Phase 3 feature set

#### Scenario: Local development and production are configured separately
- **WHEN** a developer runs local development commands
- **THEN** Wrangler SHALL use local development defaults and local storage simulation
- **AND** development authentication SHALL remain limited to local development
- **WHEN** an operator runs production migration or deploy commands
- **THEN** those commands SHALL select the production Wrangler environment explicitly
