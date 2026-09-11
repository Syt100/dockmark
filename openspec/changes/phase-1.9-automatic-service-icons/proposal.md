# Proposal

## Why
Dockmark can currently render emoji/text, direct image URLs, and a primary-endpoint `/favicon.ico` guess, but it cannot discover the icon a site actually declares or persist a fetched icon as a managed Dockmark asset. Homelab services frequently expose better icons through HTML metadata, web manifests, or non-standard paths, and some endpoints are reachable only from the user's browser while public endpoints are better fetched by the Worker.

## What Changes
- Add two explicit automatic icon discovery actions in the service editor: browser-side discovery and Worker-side discovery.
- Let the user choose which service endpoint is the icon source, defaulting to the primary endpoint.
- Discover declared favicon, apple-touch-icon, manifest, and conventional favicon candidates and choose a best candidate deterministically.
- Persist icon bytes that Dockmark can read as content-addressed R2 assets and activate the existing `r2` service icon mode.
- Keep browser-only external icon URLs as `iconType=url` when the browser can render a candidate but cannot read its bytes because of CORS.
- Add authenticated Worker APIs for server discovery, browser uploads, and managed icon delivery.
- Treat Worker-side URL fetching as an SSRF-sensitive boundary with scheme, host, redirect, timeout, size, and credential restrictions.
- Extend Dockmark import/export so managed R2 icon assets remain portable between Dockmark instances instead of exporting broken instance-local keys.
- Preserve all existing manual icon modes and never replace the current icon when discovery fails.

## Non-Goals
- Browser-extension-assisted LAN/Tailscale discovery; that is specified separately in `phase-4.1-extension-assisted-service-icons`.
- Silent fallback from browser discovery to Worker discovery or vice versa.
- Background scanning of every service for icons.
- Capturing authenticated page content, forwarding browser cookies, or forwarding Authorization headers to icon source sites.
- Public R2 buckets.
- Screenshot generation or general-purpose remote image proxying.

## Implementation Status
This change is a specification only until its implementation tasks are explicitly started.
