## 1. Data Model and Shared Types

- [x] 1.1 Add a D1 migration for `auth_users` and `auth_sessions`.
- [x] 1.2 Add shared auth request/response types and extend auth mode types with `builtin` and `oidc`.
- [x] 1.3 Add Worker environment typing for built-in auth settings, setup token, and session cookie settings.

## 2. Worker Auth Core

- [x] 2.1 Implement password verifier utilities using Worker-compatible WebCrypto and constant-time comparison.
- [x] 2.2 Implement session token creation, hashing, lookup, expiry, revocation, and cookie helpers.
- [x] 2.3 Implement D1 repository functions for admin setup, user lookup, and session lifecycle.
- [x] 2.4 Update auth adapters so `builtin` authenticates via session cookie, `development` remains local-only, and `oidc`/`cloudflare-access` fail closed with friendly configuration errors.

## 3. Worker Auth APIs

- [x] 3.1 Add setup status and setup submit endpoints guarded by one-time setup token rules.
- [x] 3.2 Add login, logout, and current-user endpoints.
- [x] 3.3 Ensure existing protected navigation APIs use the updated adapter behavior.
- [x] 3.4 Add Worker tests for setup, login, logout, expired/revoked sessions, unauthenticated access, and unsupported auth modes.

## 4. Web Authentication UI

- [x] 4.1 Add an auth client module for setup status, setup, login, logout, and current user.
- [x] 4.2 Add setup and login views in Chinese with responsive layouts consistent with the current design system.
- [x] 4.3 Add route guard behavior for unauthenticated users and preserve return-to route after login.
- [x] 4.4 Add current-user display and logout action to app navigation.
- [x] 4.5 Add focused web tests for auth route decisions and auth UI behavior.

## 5. Documentation and Validation

- [x] 5.1 Update deployment documentation for `AUTH_MODE=builtin`, `SETUP_TOKEN`, cookie/security expectations, and unsupported auth modes.
- [x] 5.2 Run `corepack pnpm validate`.
- [x] 5.3 Run `openspec validate --all --strict --no-interactive`.
- [x] 5.4 Commit the completed change.
