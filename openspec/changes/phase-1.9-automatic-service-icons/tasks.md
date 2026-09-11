# Tasks

- [ ] Add private R2 icon buckets/bindings for development or preview and production environments.
- [ ] Add shared automatic-icon API types, discovery result types, and explicit fetch/upload limits.
- [ ] Implement managed icon validation, SHA-256 content addressing, R2 storage, and authenticated asset delivery.
- [ ] Implement deterministic HTML, manifest, and conventional-path icon candidate discovery and ranking.
- [ ] Implement browser-side discovery with CORS-readable upload and external-URL fallback behavior.
- [ ] Implement Worker-side discovery with SSRF validation, manual redirect validation, credential stripping, size limits, candidate limits, and timeouts.
- [ ] Add service-editor source-endpoint selection, Browser fetch and Server fetch actions, preview, retry, and failure-preserves-existing-icon behavior.
- [ ] Render `iconType=r2` through the authenticated managed-asset route with stable fallbacks.
- [ ] Add export schema v2 managed icon assets while retaining import compatibility with schema v1.
- [ ] Validate v2 managed assets by hash/media type and restore them into destination R2 before restoring item references.
- [ ] Add Web, Worker, shared-contract, SSRF, import/export, and icon-rendering regression coverage.
- [ ] Run `corepack pnpm validate` after implementation.
- [ ] Run `openspec validate --all --strict --no-interactive` when the OpenSpec CLI is available.
