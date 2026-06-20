## Context

`apps/extension` currently exports a placeholder constant and only runs `tsc --noEmit`. Phase 4 needs an eventual MV3 extension for one-way bookmark sync, but implementing pairing and sync now would expand scope. A buildable skeleton gives the project a real extension boundary and validates permissions before sync work begins.

## Goals / Non-Goals

**Goals:**

- Produce a minimal extension build output with `manifest.json` and background JavaScript.
- Keep permissions intentionally small.
- Add tests that prevent accidental broad permissions or host access.

**Non-Goals:**

- No pairing UI or pairing API.
- No sync token storage.
- No bookmark tree reading or upload.
- No server-side Phase 4 API changes.
- No password, token, API key, OTP seed, session cookie, or Homelab credential storage.

## Decisions

### Generate the manifest from TypeScript

Keep manifest data in TypeScript so tests can import and assert it, then generate `dist/manifest.json` during build.

Alternative considered: hand-written static JSON. That is simpler but makes tests duplicate manifest parsing and makes future typed extension constants less convenient.

### Start with no host permissions

The foundation manifest will avoid host permissions until pairing/sync endpoints exist. Bookmark permission is also deferred until the extension actually reads the browser bookmark tree.

Alternative considered: request `bookmarks` now. That asks for sensitive access before the feature exists.

## Risks / Trade-offs

- [Risk] The extension cannot do useful sync work yet. -> Mitigation: this change explicitly targets package foundation only; Phase 4 sync remains separately specified.
- [Risk] Additional build script complexity. -> Mitigation: keep the script small and deterministic, with no external bundler dependency.
