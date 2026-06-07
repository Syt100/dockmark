## Why

Service records already store `icon` and `icon_type`, but the web UI treats every icon as plain emoji text. This makes favicon, image URL, and future branded icon paths unusable, and causes inconsistent icon sizing across home navigation and management lists.

## What Changes

- Add a unified service icon presentation path for home cards, service management rows, and service editor previews.
- Allow service editors to choose between emoji/text, image URL, and primary-endpoint favicon icon modes.
- Preserve and submit the selected `iconType` instead of forcing every service icon to `emoji`.
- Add deterministic fallback rendering when an icon value is missing, unsupported, or an image fails to load.
- Tighten shared validation for icon payloads so invalid URL icon values are rejected before persistence.
- Keep R2 upload/storage and server-side favicon fetching out of this phase.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `phase-1-service-navigation`: Service navigation SHALL support multiple service icon modes with stable display and fallback behavior across home and management UI.

## Impact

- `packages/shared`: service item validation for icon type/value combinations.
- `apps/web`: service form mapping, service editor controls, home navigation cards, service management rows, and focused component tests.
- `apps/worker`: existing item persistence should continue to store `icon` and `icon_type`; no schema migration is expected.
- `seeds/local-dev.sql`: local sample data can include non-emoji icon modes for regression visibility.

Non-goals:
- No password, token, API key, OTP seed, session cookie, or other secret storage.
- No R2 asset upload flow in this phase.
- No bookmark import/export, browser extension sync, or browser bookmark synchronization changes.
- No server-side crawling of LAN-only Homelab services for favicon discovery.
