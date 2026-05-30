## Context

Dockmark currently has an adapter-based authentication boundary with `development` and `cloudflare-access` modes. Local development returns a mock user, while Cloudflare Access mode only checks Access headers and is not a complete production authentication mechanism. The project now needs a production path that does not require activating Cloudflare Zero Trust or binding a payment method.

This change keeps authentication centralized in the Worker and keeps the web UI free of secret handling. D1 remains the source of truth for persistent auth users and sessions. KV is not used for auth session state because sessions must be authoritative and revocable.

## Goals / Non-Goals

**Goals:**
- Make built-in authentication the default production-ready auth mode.
- Initialize the first administrator with a one-time setup token.
- Store only password verifiers and session hashes, never plaintext passwords or service credentials.
- Use HttpOnly, SameSite session cookies for browser/API access.
- Keep business routes behind `requireAuth` and normalized user context.
- Fail closed with a friendly setup error when `AUTH_MODE=oidc` or `AUTH_MODE=cloudflare-access` is configured before implementation.

**Non-Goals:**
- Implement OIDC authorization-code login.
- Implement Cloudflare Access JWT validation.
- Implement role-based access control, multi-user invitation, password reset email, or account recovery.
- Store service credentials, API keys, OTP seeds, browser session cookies, or sync tokens.
- Change service navigation, import/export, bookmark import, or browser extension sync behavior.

## Decisions

### Built-in auth uses D1 users and session hashes

The Worker will add `auth_users` and `auth_sessions` tables. `auth_users` stores a single administrator for this phase, with an email, display name, password hash, algorithm metadata, timestamps, and disabled flag. `auth_sessions` stores only a hash of the random session token, plus user ID, expiry, creation time, and last-seen time.

Alternative considered: store signed stateless session cookies only. This reduces D1 reads, but it makes logout and forced revocation harder. D1-backed sessions fit the single-admin product and keep revocation simple.

### Setup requires a one-time token

When no admin user exists, Dockmark exposes a setup flow that requires `SETUP_TOKEN`. The token is compared server-side and is never stored in D1. After an admin exists, setup endpoints return a conflict response and the token no longer works.

Alternative considered: bootstrap email/password from environment variables. That leaves a long-lived password in deployment config and makes rotation less obvious.

### Password hashing uses Worker-compatible WebCrypto

The first implementation will use PBKDF2-SHA-256 with a per-user random salt and a high iteration count encoded in the stored verifier string. It is supported by WebCrypto in the Workers runtime and by Node test environments. If Argon2id becomes a stable dependency/runtime fit later, a future migration can add a new password algorithm while preserving the verifier abstraction.

Alternative considered: bcrypt or Argon2id dependency. Those are stronger defaults in many server runtimes, but Workers compatibility and bundle constraints make WebCrypto PBKDF2 the pragmatic first implementation.

### Auth modes fail closed unless implemented

`development` remains local-only. `builtin` becomes the supported production mode. `oidc` and `cloudflare-access` remain explicit enum values for planned adapter support, but they return a clear 503 setup error until implemented securely. This avoids accidental insecure production deployment through partially implemented modes.

Alternative considered: keep permissive Cloudflare Access header checks. That would contradict the production-hardening goal because forged headers could be trusted if the Worker is reachable outside Access.

### Frontend handles unauthenticated state with app routes

The web app will add setup and login views. API requests that receive `401` can route to `/login`, while `503` unsupported-auth responses show a configuration-focused message. After login, the user returns to the originally requested route when available.

Alternative considered: rely on browser basic auth or reverse proxy auth. That would not work uniformly for Cloudflare Workers and would not support later OIDC inside the same app model.

## Risks / Trade-offs

- [Risk] PBKDF2 is less memory-hard than Argon2id.  
  Mitigation: use per-user salts, high iterations, constant-time hash comparison, and keep the verifier format algorithm-versioned for future upgrade.

- [Risk] A setup token left configured could be confused for an active credential.  
  Mitigation: setup token only works while no admin exists, and documentation will say to rotate or remove it after setup.

- [Risk] Session cookies can be mishandled behind local HTTP.  
  Mitigation: set `Secure` automatically for HTTPS requests and document that production must use HTTPS; use HttpOnly and SameSite=Lax consistently.

- [Risk] Single-admin scope is limiting.  
  Mitigation: schema can support additional users later, but this phase only exposes one administrator to keep the security model small.

## Migration Plan

1. Apply the new D1 migration before enabling `AUTH_MODE=builtin`.
2. Configure `AUTH_MODE=builtin` and a strong random `SETUP_TOKEN`.
3. Visit the setup page, create the administrator, and verify `/api/auth/me`.
4. Remove or rotate `SETUP_TOKEN` after setup.
5. Rollback strategy: restore the previous Worker version and keep the auth tables unused. Existing service navigation tables are not modified.

## Open Questions

- None for this phase. OIDC provider selection and Cloudflare Access JWT validation are intentionally deferred to later changes.
