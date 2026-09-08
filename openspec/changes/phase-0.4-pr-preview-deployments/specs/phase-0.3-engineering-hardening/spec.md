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

Dockmark SHALL isolate pull request previews from production persistence and from other pull requests' D1 state.

#### Scenario: Preview storage is prepared
- **WHEN** a pull request preview is deployed
- **THEN** the Worker SHALL bind to D1 database `dockmark-preview-pr-<number>` for that pull request
- **AND** it MAY bind to the shared non-production `dockmark-preview` KV namespace
- **AND** it SHALL NOT bind to production D1 or KV resources
- **AND** current migrations SHALL be applied before upload
- **AND** idempotent demo seed data SHALL be available for UI review.

#### Scenario: Pull request is closed
- **WHEN** an eligible pull request is closed, whether merged or not
- **THEN** CI SHALL delete only that pull request's `dockmark-preview-pr-<number>` D1 database
- **AND** cleanup SHALL succeed when the database is already absent.

### Requirement: Preview Review Link

Dockmark SHALL make the current pull request preview easy to open from GitHub.

#### Scenario: Preview upload succeeds
- **WHEN** the preview version is uploaded successfully
- **THEN** CI SHALL create or update one pull request comment with the Preview URL
- **AND** the comment SHALL identify the pull request head commit rather than GitHub's temporary merge commit
- **AND** the comment SHALL identify the pull request's preview D1 database
- **AND** later commits SHALL update the same comment instead of creating duplicates.
