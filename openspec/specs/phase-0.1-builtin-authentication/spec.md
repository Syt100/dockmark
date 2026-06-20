# phase-0.1-builtin-authentication Specification

## Purpose

Define Dockmark's built-in production authentication baseline with one-time administrator setup, D1-backed sessions, login/logout UI, and fail-closed behavior for reserved auth modes.

## Requirements

### Requirement: Built-in administrator setup

Dockmark SHALL provide a built-in administrator setup flow guarded by a one-time setup token.

#### Scenario: First administrator is created

- **WHEN** `AUTH_MODE=builtin`, no administrator exists, and the user submits a valid setup token with a valid email and password
- **THEN** Dockmark SHALL create the administrator in D1
- **AND** it SHALL store only a password verifier, password metadata, and user profile fields
- **AND** it SHALL NOT store the setup token or plaintext password

#### Scenario: Setup token is missing or invalid

- **WHEN** no administrator exists and setup is submitted without the configured setup token
- **THEN** Dockmark SHALL reject the setup request
- **AND** it SHALL NOT reveal whether the submitted email would be accepted

#### Scenario: Administrator already exists

- **WHEN** an administrator already exists
- **THEN** Dockmark SHALL reject additional setup attempts
- **AND** the setup token SHALL no longer grant account creation.

### Requirement: Built-in login and session authentication

Dockmark SHALL authenticate built-in users with password verification and revocable HttpOnly browser sessions.

#### Scenario: User logs in successfully

- **WHEN** `AUTH_MODE=builtin` and a user submits the correct email and password
- **THEN** Dockmark SHALL create a D1-backed session
- **AND** it SHALL return an HttpOnly SameSite cookie containing only an opaque session token
- **AND** subsequent API requests with that cookie SHALL resolve to a normalized authenticated user context.

#### Scenario: User logs in with invalid credentials

- **WHEN** `AUTH_MODE=builtin` and login credentials are invalid
- **THEN** Dockmark SHALL return an unauthorized response with a generic error
- **AND** it SHALL NOT reveal whether the email or password was incorrect.

#### Scenario: User logs out

- **WHEN** an authenticated built-in user logs out
- **THEN** Dockmark SHALL revoke the current D1 session
- **AND** it SHALL clear the session cookie.

#### Scenario: Session is expired or revoked

- **WHEN** a request includes an expired, missing, or revoked session
- **THEN** protected APIs SHALL reject the request as unauthenticated.

### Requirement: Authentication UI

Dockmark SHALL provide setup and login screens for built-in authentication.

#### Scenario: Unauthenticated user opens the app before setup

- **WHEN** `AUTH_MODE=builtin`, no administrator exists, and an unauthenticated user opens the app
- **THEN** the web UI SHALL show the setup flow instead of the service dashboard.

#### Scenario: Unauthenticated user opens the app after setup

- **WHEN** `AUTH_MODE=builtin`, an administrator exists, and an unauthenticated user opens the app
- **THEN** the web UI SHALL show the login flow
- **AND** after successful login it SHALL return to the originally requested app route when possible.

#### Scenario: Authenticated user views account state

- **WHEN** a built-in authenticated user opens Dockmark
- **THEN** the web UI SHALL expose the current user identity and a logout action.

### Requirement: Unsupported auth modes fail closed

Dockmark SHALL fail closed with a friendly setup error for configured auth modes that are reserved but not implemented.

#### Scenario: OIDC mode is configured before implementation

- **WHEN** `AUTH_MODE=oidc`
- **THEN** Dockmark SHALL reject protected API access with a configuration error
- **AND** it SHALL NOT allow anonymous access or silently fall back to development authentication.

#### Scenario: Cloudflare Access mode is configured before hardening

- **WHEN** `AUTH_MODE=cloudflare-access`
- **THEN** Dockmark SHALL reject protected API access with a configuration error
- **AND** it SHALL NOT trust Cloudflare Access identity headers until JWT validation is implemented.

### Requirement: Built-in auth security boundary

Dockmark SHALL distinguish its own login credentials from Homelab service credentials.

#### Scenario: Built-in auth stores password verifier

- **WHEN** Dockmark stores an administrator password verifier for application login
- **THEN** this SHALL be treated as Dockmark authentication metadata
- **AND** Dockmark SHALL continue to reject service password, API key, token, OTP seed, and browser session cookie fields in service navigation data.

#### Scenario: Production configuration is unsafe

- **WHEN** production uses `AUTH_MODE=development`
- **THEN** Dockmark SHALL treat the configuration as unsafe
- **AND** production documentation SHALL instruct operators to use `AUTH_MODE=builtin` until another production adapter is implemented.
