## ADDED Requirements

### Requirement: Monorepo project structure
Dockmark SHALL use a TypeScript monorepo structure that separates web UI, Worker API, browser extension, shared code, and database migrations.

#### Scenario: Repository is initialized
- **WHEN** a developer opens the repository
- **THEN** the repository SHALL contain `apps/web`, `apps/worker`, `apps/extension`, `packages/shared`, and `migrations`
- **AND** package management SHALL use `pnpm` workspaces

### Requirement: Frontend technology baseline
Dockmark SHALL implement the web UI with Vue 3, TypeScript, Vite, Vue Router, and Tailwind CSS.

#### Scenario: Web app is initialized
- **WHEN** the web app is created
- **THEN** it SHALL use Vue 3 single-file components with TypeScript
- **AND** it SHALL use Vite for local development and production builds
- **AND** it SHALL use Tailwind CSS for styling

### Requirement: Cloudflare-first runtime baseline
Dockmark SHALL target Cloudflare Workers as the backend runtime and Workers Assets as the web UI hosting path.

#### Scenario: Worker development server starts
- **WHEN** the Worker app is run locally
- **THEN** it SHALL expose a health endpoint that returns a successful response
- **AND** it SHALL be able to serve the built web UI through the configured assets binding

### Requirement: Adapter-based authentication foundation
Dockmark SHALL define authentication behind an application-level adapter so Cloudflare Access is one supported production mode, not the only possible production authentication mechanism.

#### Scenario: Cloudflare Access is used
- **WHEN** Dockmark is deployed behind Cloudflare Access
- **THEN** the Worker SHALL authenticate web UI and normal API requests through a Cloudflare Access auth adapter
- **AND** application services SHALL consume a normalized authenticated user context instead of reading Access headers directly

#### Scenario: Future self-hosted auth is added
- **WHEN** Dockmark later supports deployment as a self-hosted host service
- **THEN** the authentication implementation SHALL be replaceable without changing service navigation, import/export, bookmark import, or sync business logic

### Requirement: Database migration baseline
Dockmark SHALL manage D1 schema through SQL migration files committed to the repository.

#### Scenario: Fresh database is created
- **WHEN** migrations are applied to an empty D1 database
- **THEN** migration files SHALL be ordered and repeatable in local and remote environments

### Requirement: Development quality gates
Dockmark SHALL provide pnpm commands for type checking, testing, linting or formatting, building, and local development.

#### Scenario: Developer validates changes locally
- **WHEN** the developer runs the documented validation command
- **THEN** TypeScript checks SHALL pass for all apps and shared packages
- **AND** tests SHALL run for shared utility behavior that is easy to regress

