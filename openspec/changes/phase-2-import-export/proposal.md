## Why

Dockmark users need a reliable way to back up, restore, and move their Phase 1 service navigation data before automatic backup or browser sync features exist.

## What Changes

- Add authenticated JSON export for categories, tags, services, endpoints, and item-tag relationships.
- Add authenticated import preview that validates Dockmark JSON without writing data.
- Add authenticated import execution with additive and replace-all modes.
- Preserve exported record IDs and timestamps so full backups can be restored predictably.
- Invalidate navigation cache after successful imports.
- Add a Vue import/export view for downloading backups, uploading JSON, previewing validation results, and confirming imports.

Non-goals:

- Do not implement R2 backups, scheduled backups, backup retention, encrypted backups, or automatic restore jobs.
- Do not import browser `bookmarks.html` in this change.
- Do not implement browser extension sync in this change.
- Do not store authentication tokens, session cookies, API keys, passwords, OTP seeds, or other secrets in export documents.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `phase-2-import-export`: Implement the manual Dockmark JSON import/export capability defined by the existing Phase 2 spec.

## Impact

- Affected directories: `apps/worker`, `apps/web`, `packages/shared`.
- Affected APIs: new `/api/import-export/*` routes.
- Affected data: Phase 1 navigation tables and navigation cache version.
- Depends on Phase 1 service navigation data model and auth middleware.
