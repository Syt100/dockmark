# Tasks

> Deferred: this phase is specified now but SHALL NOT be implemented as part of the Phase 1.9 automatic service icon work.

- [ ] Confirm Phase 4 paired-client authentication is available and define a least-privilege icon-discovery/upload scope.
- [ ] Add short-lived server-side icon discovery request/result APIs for communication between the web editor and paired extensions.
- [ ] Add `optional_host_permissions` support without adding permanent `<all_urls>` access.
- [ ] Request only the exact target origin at runtime and handle permission denial as a normal failure.
- [ ] Implement extension-side HTML/manifest/favicon discovery using Phase 1.9 candidate ranking and shared size/count limits.
- [ ] Keep extension target requests credential-free and prevent target HTML/arbitrary response bodies from being uploaded to Dockmark.
- [ ] Upload accepted icon bytes through the Phase 1.9 managed-icon validation/R2 pipeline.
- [ ] Add web-editor request progress, extension availability, candidate preview, confirmation, expiry, and cancellation behavior.
- [ ] Release runtime target-origin permission after discovery unless a separately documented user choice requires retention.
- [ ] Add regression coverage for permission boundaries, LAN/Tailscale targets, redirect-origin changes, request expiry, and failure-preserves-existing-icon behavior.
- [ ] Run `corepack pnpm validate` after implementation.
- [ ] Run `openspec validate --all --strict --no-interactive` when the OpenSpec CLI is available.
