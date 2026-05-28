## Purpose
Define the initial Dockmark project foundation so implementation can start from a Cloudflare-first, TypeScript monorepo with clear app boundaries, bindings, migrations, and validation commands.

## Requirements

### Requirement: Monorepo project structure
Dockmark SHALL use a TypeScript monorepo structure that separates web UI, Worker API, browser extension, shared code, and database migrations.

#### Scenario: Repository is initialized
- **WHEN** a developer opens the repository
- **THEN** the repository SHALL contain `apps/web`, `apps/worker`, `apps/extension`, `packages/shared`, and `migrations`
- **AND** each app or package SHALL have a clear build/test entry point or placeholder documented in the root package configuration

#### Scenario: Shared code is needed
- **WHEN** schemas, API types, URL normalization, IDs, or cryptographic helpers are used by more than one app
- **THEN** they SHALL live in `packages/shared` instead of being duplicated

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

### Requirement: Database migration baseline
Dockmark SHALL manage D1 schema through SQL migration files committed to the repository.

#### Scenario: Fresh database is created
- **WHEN** migrations are applied to an empty D1 database
- **THEN** the schema SHALL be sufficient for Phase 1 service navigation data
- **AND** migration files SHALL be ordered and repeatable in local and remote environments

### Requirement: Configuration and environment boundaries
Dockmark SHALL separate deploy-time Cloudflare bindings from application-level settings.

#### Scenario: Application reads environment bindings
- **WHEN** the Worker handles a request
- **THEN** it SHALL access D1 and KV through typed bindings
- **AND** it SHALL fail with a clear error if a required binding is missing

#### Scenario: Optional features are disabled
- **WHEN** optional bindings such as R2 are not configured
- **THEN** the application SHALL still run with the Phase 1 through Phase 3 feature set

### Requirement: Development quality gates
Dockmark SHALL provide basic commands for type checking, testing, linting or formatting, and local development.

#### Scenario: Developer validates changes locally
- **WHEN** the developer runs the documented validation command
- **THEN** TypeScript checks SHALL pass for all apps and shared packages
- **AND** tests SHALL run for shared utility behavior that is easy to regress
