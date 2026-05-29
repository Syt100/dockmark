## Context

The previous UX phase introduced Chinese UI, responsive route-driven create/edit screens, card-based management lists, delete confirmation, and tag editing. This usability phase focuses on the next layer: making common operations faster and reducing hesitation or ambiguity during routine service management.

## Goals / Non-Goals

**Goals:**

- Let users narrow service management lists by category, status, tag, and text query.
- Make common error and success messages more understandable in Chinese.
- Include the actual resource name in destructive confirmations.
- Let the home empty state take users directly to service creation.
- Add endpoint template shortcuts for common service addresses.
- Keep mobile forms document-flow based and improve the final action area.

**Non-Goals:**

- Import/export, backup, bookmark import, or extension sync.
- New database fields.
- Usage tracking, analytics, or automatic “frequent services”.
- Full i18n framework.

## Decisions

### Client-side filtering only

Service management filtering will run client-side over the existing `/api/items`, `/api/categories`, and `/api/tags` data. This avoids new API query semantics while the dataset is still expected to be personal Homelab scale.

### Small Chinese error helper

Frontend fetch errors and known validation fragments should be converted into concise Chinese messages. This is not a full API error envelope migration; it is a UX-level improvement until a later API conventions change standardizes errors globally.

### Named confirmations

`ConfirmAction` should accept a message built by the parent view, so service/category/tag cards can show names in delete confirmation text.

### Endpoint templates mutate the current form

Endpoint quick templates should add a new endpoint row with a localized label and kind. They should not guess network addresses or perform external favicon discovery in this phase.

### Mobile action area remains in normal flow

The service editor can use clearer button layout and spacing on mobile, but it must not switch to a fixed fullscreen action bar or rely on viewport-height tricks.

## Risks / Trade-offs

- [Risk] Client-side filters may not scale to very large datasets.  
  Mitigation: keep it for Phase 1 personal scale; future pagination/search can move to API when needed.

- [Risk] Mapping backend text errors on the frontend can be incomplete.  
  Mitigation: handle common known messages now and leave unknown messages visible but prefixed with friendly context.

- [Risk] More filters can make the service page busier.  
  Mitigation: use compact controls and a single reset action.
