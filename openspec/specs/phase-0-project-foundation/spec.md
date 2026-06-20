## Purpose

Define the initial Dockmark project foundation so implementation can start from a Cloudflare-first, TypeScript monorepo with clear app boundaries, bindings, migrations, and validation commands.

## Requirements

### Requirement: Monorepo project structure

Dockmark SHALL use a TypeScript monorepo structure that separates web UI, Worker API, browser extension, shared code, and database migrations.

#### Scenario: Repository is initialized

- **WHEN** a developer opens the repository
- **THEN** the repository SHALL contain `apps/web`, `apps/worker`, `apps/extension`, `packages/shared`, and `migrations`
- **AND** each app or package SHALL have a clear build/test entry point or placeholder documented in the root package configuration
- **AND** package management SHALL use `pnpm` workspaces

#### Scenario: Shared code is needed

- **WHEN** schemas, API types, URL normalization, IDs, or cryptographic helpers are used by more than one app
- **THEN** they SHALL live in `packages/shared` instead of being duplicated

### Requirement: Frontend technology baseline

Dockmark SHALL implement the web UI with Vue 3, TypeScript, Vite, Vue Router, and Tailwind CSS.

#### Scenario: Web app is initialized

- **WHEN** the web app is created
- **THEN** it SHALL use Vue 3 single-file components with TypeScript
- **AND** it SHALL use Vite for local development and production builds
- **AND** it SHALL use Tailwind CSS for styling

#### Scenario: Navigation is added

- **WHEN** multiple web views are implemented
- **THEN** routing SHALL use Vue Router
- **AND** shared state SHALL be introduced only when it removes meaningful duplication or supports cross-view behavior

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

#### Scenario: Local development and production are configured separately

- **WHEN** a developer runs local development commands
- **THEN** Wrangler SHALL use local development defaults and local storage simulation
- **AND** development authentication SHALL remain limited to local development
- **WHEN** an operator runs production migration or deploy commands
- **THEN** those commands SHALL select the production Wrangler environment explicitly

### Requirement: Development quality gates

Dockmark SHALL provide pnpm commands for type checking, testing, linting or formatting, building, and local development.

#### Scenario: Developer validates changes locally

- **WHEN** the developer runs the documented validation command
- **THEN** TypeScript checks SHALL pass for all apps and shared packages
- **AND** tests SHALL run for shared utility behavior that is easy to regress
