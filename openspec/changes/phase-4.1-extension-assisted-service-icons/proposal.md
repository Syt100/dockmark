# Proposal

## Why
Phase 1.9 browser discovery remains constrained by CORS, mixed-content rules, Private Network Access policy, and normal page JavaScript security boundaries. Those limits matter most for Dockmark's core Homelab use case: LAN, Tailscale, HTTP-only, or otherwise browser-reachable services that the Cloudflare Worker cannot and should not fetch.

A paired Dockmark browser extension can perform user-approved requests from the user's own device with runtime host permission, then reuse the Phase 1.9 managed-icon storage pipeline without exposing private targets to Worker-side discovery.

## What Changes
- Add an extension-assisted service icon discovery capability after the extension pairing foundation is available.
- Use runtime optional host permissions and request permission only for the exact HTTP(S) origin the user explicitly chooses.
- Allow the extension to discover icon metadata/bytes for LAN, Tailscale, CORS-restricted, and HTTP-only services from the user's browser environment.
- Reuse Phase 1.9 icon candidate ranking, byte/media limits, managed R2 upload, preview, and service-editor confirmation semantics.
- Keep target fetches credential-free by default and send only icon bytes plus bounded source metadata back to Dockmark, not target page HTML.
- Provide a server-mediated request/result handshake suitable for connecting the Dockmark web editor to a paired extension without requiring permanent broad host access.

## Non-Goals
- Implementing this extension capability in the current work; this change records the later phase only.
- Granting permanent `<all_urls>` host permission.
- Silently scanning all Dockmark services or browsing history for icons.
- Reading or uploading authenticated private page contents.
- Bypassing TLS certificate errors.
- Changing Phase 4 bookmark sync direction or adding server-to-browser bookmark writes.

## Implementation Status
Specification only. No extension manifest permission, extension runtime behavior, API, or web UI implementation is part of the current commit.
