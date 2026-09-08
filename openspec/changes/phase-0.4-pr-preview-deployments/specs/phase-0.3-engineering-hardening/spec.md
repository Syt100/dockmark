# phase-0.3-engineering-hardening Specification Delta

## ADDED Requirements

### Requirement: Pull Request Preview Deployments

Dockmark SHALL provide a live non-production preview for eligible pull requests after validation succeeds.

#### Scenario: Same-repository pull request is validated
- **WHEN** a pull request from the Dockmark repository passes the existing validation job
- **THEN** CI SHALL upload a Cloudflare Worker preview version
- **AND** the preview SHALL use a stable alias derived from the pull request number
- **AND** subsequent commits to the same pull request SHALL update that alias.

#### Scenario: Pull request comes from a fork
- **WHEN** a pull request head belongs to a fork
- **THEN** CI SHALL run validation only
- **AND** Cloudflare deployment secrets SHALL NOT be exposed to the fork workflow.

### Requirement: Preview Data Isolation

Dockmark SHALL isolate pull request previews from production persistence.

#### Scenario: Preview storage is prepared
- **WHEN** a pull request preview is deployed
- **THEN** the Worker SHALL bind to the shared `dockmark-preview` D1 database and preview KV namespace
- **AND** it SHALL NOT bind to production D1 or KV resources
- **AND** current migrations SHALL be applied before upload
- **AND** idempotent demo seed data SHALL be available for UI review.

### Requirement: Preview Review Link

Dockmark SHALL make the current pull request preview easy to open from GitHub.

#### Scenario: Preview upload succeeds
- **WHEN** the preview version is uploaded successfully
- **THEN** CI SHALL create or update one pull request comment with the Preview URL
- **AND** the comment SHALL identify the commit being previewed
- **AND** later commits SHALL update the same comment instead of creating duplicates.
