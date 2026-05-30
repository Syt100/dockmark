## Why

Dockmark should not require Cloudflare Zero Trust billing setup for production use. A built-in administrator login gives self-hosted deployments a card-free default while preserving the existing auth adapter boundary for future OIDC support.

## What Changes

- Add a built-in production authentication mode as the default recommended production path.
- Add one-time setup-token administrator initialization for the first admin account.
- Add HttpOnly session-cookie authentication for normal web and API requests.
- Add login, logout, current-user, and setup API/UI flows.
- Reserve `oidc` and `cloudflare-access` auth modes as explicit unsupported production modes for now; misconfiguration SHALL fail closed with a friendly setup error instead of allowing access.
- Keep the credential boundary unchanged: Dockmark SHALL NOT store service passwords, API keys, tokens, OTP seeds, session cookies, or other service secrets.
- Non-goal: implement OIDC login in this change.
- Non-goal: implement Cloudflare Access JWT validation in this change.
- Non-goal: implement multi-user role management or sharing in this change.
- Non-goal: implement browser extension sync or per-client sync tokens in this change.

## Capabilities

### New Capabilities
- `phase-0.1-builtin-authentication`: Built-in administrator setup, login, session, logout, and fail-closed handling for unsupported auth modes.

### Modified Capabilities
- `phase-0-project-foundation`: Production authentication defaults change from Cloudflare Access first to built-in auth first, while keeping adapter-based authentication as the architectural boundary.

## Impact

- Worker auth adapter, middleware, and API routes.
- New D1 migration for auth users and sessions.
- Web routing and unauthenticated screens for setup/login.
- Shared auth response types.
- Deployment documentation and environment variables.
- Test coverage for setup, login, logout, session expiry, and unsupported auth modes.
