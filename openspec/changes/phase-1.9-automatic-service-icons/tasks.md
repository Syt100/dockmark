# Tasks

- [x] Add private R2 icon buckets/bindings for development or preview and production environments.
- [x] Add shared automatic-icon API types, discovery result types, and explicit fetch/upload limits.
- [x] Implement managed icon validation, SHA-256 content addressing, R2 storage, and authenticated asset delivery.
- [x] Implement deterministic HTML, manifest, and conventional-path icon candidate discovery and ranking.
- [x] Implement browser-side discovery with CORS-readable upload and external-URL fallback behavior.
- [x] Implement Worker-side discovery with SSRF validation, manual redirect validation, credential stripping, size limits, candidate limits, and timeouts.
- [x] Add service-editor source-endpoint selection, Browser fetch and Server fetch actions, preview, retry, and failure-preserves-existing-icon behavior.
- [x] Render `iconType=r2` through the authenticated managed-asset route with stable fallbacks.
- [x] Add export schema v2 managed icon assets while retaining import compatibility with schema v1.
- [x] Validate v2 managed assets by hash/media type and restore them into destination R2 before restoring item references.
- [x] Add Web, Worker, shared-contract, SSRF, import/export, and icon-rendering regression coverage.
- [x] Run `corepack pnpm validate` after implementation.
- [x] Run `openspec validate --all --strict --no-interactive` when the OpenSpec CLI is available.

Validation note: `phase-1.9-automatic-service-icons` passes strict OpenSpec validation. The workspace-wide `--all` command was executed and also reports a pre-existing, unrelated `phase-1.7-interaction-fluidity` delta error.
