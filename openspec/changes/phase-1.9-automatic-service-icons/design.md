# Design

## Discovery Model
Automatic icon retrieval is an explicit editor action, not an automatic side effect of typing or saving a URL. The editor exposes two independent actions:

- **Browser discovery** runs on the user's current device and is useful when that browser can reach an endpoint the Worker cannot.
- **Worker discovery** runs through the Dockmark Worker and is the preferred high-quality path for public HTTP(S) endpoints because it can inspect HTML without ordinary browser CORS restrictions.

The application MUST NOT automatically send a browser-discovery target to the Worker after browser discovery fails. This preserves a clear privacy boundary for internal hostnames and private addresses.

The user can choose any configured endpoint as the icon source. The primary endpoint is selected by default.

## Candidate Discovery and Ranking
Discovery should consider, in descending semantic priority, candidates explicitly declared by the target site before conventional guesses:

1. HTML `<link rel="icon">` and compatible shortcut-icon declarations.
2. HTML `<link rel="apple-touch-icon">` declarations.
3. Icons declared by a linked web app manifest.
4. Conventional paths such as `/favicon.ico`, `/favicon.png`, `/favicon.svg`, and `/apple-touch-icon.png`.

Candidates are resolved relative to the page/manifest URL that declared them. Ranking should favor explicit declarations and useful icon quality. Known dimensions and vector/raster suitability may influence ranking, but the algorithm must remain deterministic and testable. Discovery should stop after a small bounded number of candidates rather than crawling arbitrary site assets.

## Browser Discovery
Browser discovery first attempts a CORS-permitted fetch of the selected endpoint HTML. If readable, it parses icon and manifest declarations and attempts to fetch candidate bytes.

If HTML cannot be read because of CORS, the browser may probe a bounded set of conventional icon URLs with image loading. A successfully rendered image may be presented as a candidate even when its bytes cannot be read.

Browser outcomes are therefore:

- **Managed candidate**: bytes are readable; upload them to Dockmark and store the resulting managed R2 icon.
- **External candidate**: the browser can render the icon but cannot read its bytes; store the candidate URL using the existing `url` icon mode after user confirmation.
- **No candidate**: keep the current icon unchanged and show an actionable failure state.

Browser discovery is best-effort. CORS, Private Network Access policy, HTTPS mixed-content rules, certificate errors, or browser network policy may prevent access even when the user can otherwise navigate to a service. Phase 4.1 addresses the most important LAN/CORS/mixed-content gap with an extension.

## Worker Discovery and SSRF Boundary
Worker discovery accepts only authenticated requests and only `http:` or `https:` target URLs. URLs containing embedded usernames or passwords are rejected.

Before every network hop, including every redirect, the Worker validates the destination. It rejects loopback, unspecified, private, link-local, and other non-public literal IP address ranges, localhost-like destinations, and other explicitly disallowed local host forms. Redirects are followed manually so each destination is revalidated. Platform network restrictions are defense in depth and are not the sole SSRF control.

The Worker never forwards the Dockmark user's Cookie, Authorization, session, or other credential headers to a target site. Target requests use a small fixed request-header set.

Initial implementation limits should be conservative and test-covered:

- no more than 3 redirects per fetched resource;
- HTML/manifest bodies bounded to roughly 512 KiB each;
- managed icon bytes bounded to roughly 1 MiB, with a lower default preferred when practical;
- no more than 8 candidate icon downloads per discovery attempt;
- an approximately 5 second deadline per external fetch/overall bounded request path.

Exact constants may be tightened during implementation, but they must remain explicit shared limits rather than unbounded fetches.

## Managed R2 Assets
Dockmark introduces an `ICONS` R2 binding with separate production and non-production storage. The bucket remains private.

Managed icon object keys are content-addressed:

`icons/sha256/<sha256>.<safe-extension>`

The hash is computed from validated icon bytes. This permits natural deduplication, immutable browser caching, and creation before a service item has an ID. The service record continues to use the existing fields:

- `iconType = 'r2'`
- `icon = '<managed object key>'`

No new item column is required for the first implementation.

An authenticated asset route, for example `GET /api/icon-assets/:key`, reads from R2 and returns the stored media type, ETag, and a long-lived private immutable cache policy. The R2 bucket itself is not publicly exposed.

Managed icon ingestion validates actual bytes and media type rather than trusting a filename or request Content-Type. The first implementation should prefer inert raster/icon formats. Unsanitized active SVG content MUST NOT be served as same-origin managed content; implementations may reject SVG managed assets or introduce a separately reviewed sanitization pipeline.

Because content-addressed objects can be shared by multiple services, replacing or deleting one service icon MUST NOT blindly delete the underlying object. Eager garbage collection is not required in Phase 1.9; future cleanup must prove an object is unreferenced before deletion.

## APIs
The initial API boundary is intentionally small:

- `POST /api/icons/fetch` — Worker-side discovery and managed storage for a selected public target URL.
- `POST /api/icons/upload` — accepts browser-readable icon bytes plus limited source metadata, validates and stores them as a managed R2 asset.
- `GET /api/icon-assets/:key` — authenticated managed asset delivery.

Discovery responses should return enough metadata for a preview, including managed/external result kind, icon value/key, resolved source URL, media type, and dimensions when known. Discovery does not mutate a service item by itself; the editor updates its form only after the user accepts the result.

## Editor UX
The service editor keeps a stable icon preview and the existing manual icon controls. Automatic retrieval appears as explicit actions near the preview:

- Browser fetch
- Server fetch
- Source endpoint selector
- Retry/replace action after success

Fetching shows a bounded loading state. Success previews the candidate before it replaces the form icon. Failure never clears or overwrites the previous icon.

Worker fetch should be disabled or rejected early for obviously local/private source URLs with guidance to use browser discovery instead.

## Import and Export Portability
An R2 key is instance-local, so exporting `iconType=r2` plus the key alone would create a broken backup. Phase 1.9 therefore extends the Dockmark export schema to a new asset-aware version while continuing to accept existing schema-v1 documents.

The v2 JSON document adds a top-level managed `assets` collection. Referenced R2 icons are exported once, deduplicated by content hash, with media type, byte length, hash/key identity, and base64 payload. Import validates the declared hash and media type before writing the asset to the destination R2 bucket, then restores item references.

Version-specific payload limits must account for base64 icon assets and remain below the platform request-body ceiling. The implementation should define an explicit total asset/document ceiling and actionable errors rather than silently omitting referenced managed icons.

A later backup milestone may replace base64 JSON assets with a ZIP/container format, but Phase 1.9 does not require that larger redesign.

## Failure and Compatibility
Existing `emoji`, `url`, and `favicon` records remain valid. Existing `favicon` mode keeps its simple primary-origin behavior unless the user explicitly runs automatic discovery and accepts a different result.

If R2 is unavailable or managed upload fails, Dockmark reports that failure and keeps the existing icon. It must not silently persist an unusable `r2` key.
