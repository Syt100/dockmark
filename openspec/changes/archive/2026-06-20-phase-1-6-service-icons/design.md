## Context

Dockmark service items already include `icon` and `icon_type` in the shared API model and D1 schema. The Worker persists both fields, but the web editor always submits `iconType: 'emoji'`, and the home/management UI interpolates `item.icon` as inline text. As a result, stored non-emoji icon types cannot be authored or displayed reliably.

Homelab services often live on LAN-only hostnames. A Cloudflare Worker cannot reliably fetch those favicons, while the user's browser often can. Icon discovery should therefore stay client-side for this phase.

## Goals / Non-Goals

**Goals:**

- Render service icons through a single reusable web component with stable dimensions.
- Support emoji/text, direct image URL, and primary-endpoint favicon display modes in service editing and navigation views.
- Preserve existing data shape and D1 schema.
- Provide deterministic fallback display for unsupported icon modes, missing values, and failed image loads.
- Validate icon payloads consistently in `packages/shared`.

**Non-Goals:**

- No R2 upload or asset management UI.
- No Worker-side favicon crawling, caching, or proxying.
- No new secrets, credential fields, bookmark import/export, extension sync, or auth-provider changes.
- No dependency on third-party favicon services.

## Decisions

### Use A Unified `ServiceIcon` Component

All service icon rendering will move to one Vue component that accepts the service name, `icon`, `iconType`, and optional primary endpoint URL. It will expose size variants for card/list/editor contexts while preserving fixed square dimensions.

Alternative considered: inline rendering in each view. That would duplicate fallback and image-error behavior across home cards, service rows, and editor previews.

### Resolve Favicons In The Browser

For `favicon`, the component will derive a candidate image URL from the primary endpoint origin, such as `${origin}/favicon.ico`. If the browser cannot load it, the component falls back to generated initials.

Alternative considered: Worker endpoint that fetches and caches favicons. That would fail for LAN-only services and adds cache invalidation/security review work that is not needed for the current phase.

### Keep Existing Persistence Fields

The implementation will reuse `items.icon` and `items.icon_type`. The editor will preserve `iconType` in form state, and form-to-input mapping will submit the selected type.

Alternative considered: add explicit columns like `icon_url` and `favicon_url`. That would duplicate state already represented by `icon_type` and require an unnecessary migration.

### Treat Unsupported Modes As Fallback For Display

The shared model can keep the existing enum values (`r2`, `simple-icons`) for compatibility, but the web component will not require full R2/simple-icons implementation in this phase. Unsupported or incomplete modes render the same fallback as missing icons.

Alternative considered: remove enum values until implemented. That would be a breaking API change and would not match the existing schema.

## Risks / Trade-offs

- [Risk] Browser favicon requests can fail for services with CORS, mixed content, private DNS, or missing favicon files. -> Mitigation: image load failure switches to generated initials without breaking layout.
- [Risk] Direct image URLs can leak a browser request to an external host. -> Mitigation: users must explicitly enter image URLs; Dockmark does not proxy or store secrets in icon fields.
- [Risk] Very long text icons can distort rows. -> Mitigation: service icon display uses fixed dimensions and clamps fallback text.
- [Risk] Existing data with non-URL values and `iconType: 'url'` may fail new validation on update. -> Mitigation: validation only affects submitted payloads; display still falls back safely for existing records.

## Migration Plan

No database migration is required. Existing emoji records continue to render as before through the new component. Deploying the web change enables richer icon modes for newly edited records. Rolling back returns to plain text display but does not corrupt stored icon fields.

## Open Questions

- Whether future phases should add R2-backed custom icon upload and thumbnail normalization.
- Whether future phases should support a curated simple-icons package or a small built-in service icon registry.
