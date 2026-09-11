# Design

## Prerequisites
Phase 4.1 builds on two existing/future foundations rather than replacing them:

1. Phase 1.9 provides candidate semantics, managed R2 icon storage, safe upload validation, and service-editor preview/confirmation.
2. Phase 4 browser extension sync provides a buildable extension and a paired-client authentication model.

The extension-assisted path is additive. Browser-side and Worker-side Phase 1.9 actions remain available.

## Request Handshake
A normal web page cannot reliably invoke an arbitrarily installed extension across arbitrary self-hosted Dockmark origins. Phase 4.1 therefore uses a server-mediated, short-lived request handshake rather than depending on a hard-coded extension ID or permanent content script on every possible Dockmark origin.

A representative flow is:

1. The authenticated Dockmark editor creates a short-lived icon discovery request containing the selected service/draft context and target URL.
2. A paired extension fetches pending requests when the user explicitly opens/uses its Dockmark action or otherwise performs a user-visible check.
3. The extension shows the exact target origin and asks the user to approve discovery.
4. The extension requests runtime host permission for that exact origin.
5. It discovers and reads icon candidates locally, uploads only the selected/validated icon bytes plus bounded source metadata, and marks the request ready.
6. The web editor observes the ready result, previews it, and the user accepts it before the service record is changed.

The request expires quickly and can be cancelled. Phase 4.1 does not require continuous background polling; implementation should prefer explicit/user-visible checks and may use a bounded short polling window or another reviewed wake-up mechanism.

## Extension Permission Boundary
The extension manifest may declare broad HTTP(S) patterns only as `optional_host_permissions` so runtime APIs can request an exact origin. It SHALL NOT declare permanent `<all_urls>` host access for icon discovery.

For each discovery request, the extension asks for only the exact origin needed, for example `http://192.168.32.2/*` or `https://service.example/*`. After the request completes, the extension should release the runtime origin permission unless the user has explicitly chosen to retain it for a future documented feature.

Permission denial is a normal failure state and does not trigger Worker-side fetching.

## Local Discovery
Once permission is granted, the extension can fetch target HTML and icons from its background/service-worker context without ordinary page CORS constraints. This enables LAN, Tailscale, and many HTTP-only targets that Phase 1.9 page JavaScript cannot read.

The extension reuses the Phase 1.9 candidate rules:

- declared favicon/shortcut-icon;
- apple-touch-icon;
- web manifest icons;
- bounded conventional favicon paths;
- deterministic candidate ranking;
- shared maximum HTML/manifest/icon sizes and candidate count.

Extension discovery accepts only HTTP(S) URLs. It does not read `file:`, browser-internal, extension, data, or other privileged schemes.

## Credential and Privacy Boundary
Extension source requests use `credentials: omit` or equivalent credential-free behavior by default. Phase 4.1 does not scrape authenticated pages by forwarding cookies, Authorization headers, password-manager data, or Dockmark credentials.

The extension sends Dockmark only:

- request ID;
- selected icon bytes;
- resolved icon source URL;
- media type, dimensions, and bounded diagnostic metadata needed for the preview.

It SHALL NOT upload the fetched target HTML or arbitrary response bodies.

Private target URLs are disclosed to the user's paired Dockmark server only as part of the explicit request the user created. They are never rerouted through Worker-side target fetching.

## Upload and Confirmation
The extension uses a paired-client API scope dedicated to icon discovery/upload rather than a general-purpose bearer credential. Uploaded bytes pass through the same server-side managed-icon validation and content-addressed R2 storage used by Phase 1.9 browser uploads.

A successful extension upload creates a candidate/result; it does not directly update an item. The web editor previews the candidate and the authenticated user confirms it before persisting `iconType=r2` and the managed key.

## Failure Behavior
Normal failures include:

- no paired/available extension;
- user denies runtime host permission;
- target is unreachable from the user's device;
- certificate validation fails;
- no acceptable icon is found;
- candidate exceeds shared limits;
- upload/result request expires.

All failures leave the current service icon unchanged. The UI may suggest Phase 1.9 browser or Worker discovery where appropriate, but no mode is invoked silently.

## Security Notes
Because private IP access is the purpose of this mode, Phase 1.9 Worker SSRF private-network denial rules do not apply to the extension's local fetch. The security control is instead explicit user initiation plus exact-origin runtime permission on the user's device.

The extension must still bound redirects and candidate downloads and should avoid widening a granted origin because a target redirects to a different origin. A cross-origin redirect should require validation and, when host access is required, an additional explicit runtime permission before the extension follows it.
