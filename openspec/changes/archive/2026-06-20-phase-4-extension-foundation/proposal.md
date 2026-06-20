## Why

The browser extension package is still a TypeScript placeholder while Phase 4 already defines browser-to-Dockmark sync boundaries. A minimal MV3 foundation makes the package buildable and testable without starting bookmark sync implementation early.

## What Changes

- Add a minimal MV3 manifest and background entrypoint.
- Define extension constants for identity, permissions, and future pairing/sync placeholders.
- Build the extension into a distributable directory.
- Add focused tests for manifest shape and security-relevant permissions.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `phase-4-browser-extension-sync`: Add engineering foundation requirements for the extension package while keeping actual pairing and sync behavior deferred.

## Impact

- `apps/extension`: manifest generation/source file, background entrypoint, build/test scripts.
- No Worker API changes.
- No browser bookmark reads, pairing code handling, sync token handling, server writes, or credential storage in this change.
