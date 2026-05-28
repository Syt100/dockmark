## Context

Phase 1 turns the foundation into a usable Homelab dashboard. The scope is intentionally narrower than a full bookmark manager: users can manage services, categories, endpoints, tags, and credential lookup hints, then open services from a grouped home view.

## Goals / Non-Goals

**Goals:**
- Persist service navigation data in D1.
- Model all URLs through `endpoints`.
- Expose authenticated CRUD APIs for categories, items, endpoints, and tags.
- Provide `/api/nav` as the optimized home payload.
- Cache `/api/nav` in KV with versioned keys.
- Provide Vue pages for home navigation and basic management.
- Keep the Vaultwarden credential hint boundary visible in forms and payloads.

**Non-Goals:**
- No bookmark import, browser extension sync, or Promote to Service.
- No R2 object storage.
- No health checks against private LAN services from the Worker.
- No password, token, OTP, or API key storage.
- No multi-user collaboration or role-based permissions beyond authenticated access.

## Decisions

- Use D1 as the only source of truth. KV stores only rebuildable navigation cache payloads.
- Use raw SQL with prepared statements and small repository functions for D1 access.
- Use `endpoints` as the only URL storage model. The primary service URL is the endpoint with `is_primary = 1`.
- Enforce one primary endpoint per service in application logic and, where practical for D1, through data constraints or transactional updates.
- Use versioned KV keys such as `nav:home:v<N>` rather than wildcard deletion.
- Return `/api/nav` in a shape that is directly renderable by the home page, including grouped categories, services, primary endpoint, alternate endpoints, tags, and credential hint.
- Keep service management UI operational and dense rather than marketing-oriented.

## Risks / Trade-offs

- D1 does not offer every relational constraint available in larger databases; endpoint primary uniqueness may need application-level enforcement plus focused tests.
- KV eventual consistency is acceptable for navigation cache because D1 remains authoritative and cache keys are versioned.
- Avoiding duplicated URL fields reduces inconsistency, but API response mapping must make primary and alternate endpoints convenient for the UI.

