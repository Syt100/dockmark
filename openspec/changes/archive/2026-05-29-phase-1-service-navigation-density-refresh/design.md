## Context

Phase 1 now has route-driven create/edit screens, Chinese UI, client-side service filters, and card-based management lists. That layout works on mobile, but desktop management pages need higher density and faster scanning. The service list also exposes a stale data issue after create/edit returns to the parent route.

## Goals / Non-Goals

**Goals:**

- Make service, category, and tag management pages visually consistent as compact management surfaces.
- Use borderless row/list presentation on desktop with hover highlighting instead of per-record cards.
- Keep mobile readable without introducing horizontal tables or fixed fullscreen overlays.
- Simplify the service filter area by removing its outer border and visible field labels.
- Reliably reload parent management data after create/edit routes save and return.

**Non-Goals:**

- Changing Worker APIs, D1 schema, KV cache semantics, or authentication behavior.
- Adding server-side pagination/search.
- Introducing a component library or full design system.
- Changing the home navigation page into a management table.

## Decisions

### Desktop management rows replace cards

Service, category, and tag pages will render desktop records as borderless rows in a shared visual pattern: subtle header text where useful, row separators, compact cells, and hover background changes. This makes the pages feel like management tools rather than card galleries.

Service rows need the most structure and should use a table-like grid with columns for service identity, primary address, tags, credential hint or address count, and actions. Category and tag rows can use simpler compact rows because their data is smaller.

Mobile keeps stacked cards/lists because horizontal tables would either overflow or hide important actions.

### Filter controls are inline controls, not a boxed panel

The service filter area will become a direct row of controls below the page header. Visible labels will be removed. Search input uses a placeholder, and select controls rely on their default option text such as "全部分类", "全部状态", and "全部标签".

This reduces visual bulk while keeping the controls understandable in Chinese.

### Refresh is route-state driven

Parent management pages will reload data when they observe a successful save state on their route query. The existing success flash behavior remains, but it also triggers a data refresh when returning from create/edit.

The implementation should avoid relying only on `RouterView @vue:unmounted` because component lifecycle timing can be brittle with route-driven modal/page shells.

### No optimistic local mutation for saves yet

After create/edit, the parent list reloads from the API instead of locally inserting or patching the returned entity. This keeps D1 as the source of truth and avoids duplicating normalization logic on the frontend.

## Risks / Trade-offs

- [Risk] Borderless rows can look too flat if hierarchy is weak.  
  Mitigation: use typography, spacing, row separators, and hover states rather than card borders.

- [Risk] Removing labels can reduce accessibility if controls are not named.  
  Mitigation: keep `aria-label` attributes on search and select controls while removing visible labels.

- [Risk] Reloading on save query can duplicate initial load if the page mounts with a saved query.  
  Mitigation: centralize saved-query handling and accept a small duplicate fetch only if needed, or guard repeated saved values.

- [Risk] Dense service rows can truncate long URLs or names.  
  Mitigation: use `min-w-0`, truncation, and break behavior on mobile cards.
