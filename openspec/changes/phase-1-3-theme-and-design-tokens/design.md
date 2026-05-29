## Context

Dockmark's Phase 1 frontend was built incrementally around Tailwind utility classes. This gave good delivery speed, but visual decisions now live directly in each view: color values, spacing, radii, focus rings, hover states, and card/table treatments are repeated with small differences. The current app also only declares a light color scheme, so dark mode would require broad one-off edits if added directly.

The change is limited to `apps/web`. It does not change server APIs, data storage, authentication, cache behavior, or later sync/import phases.

## Goals / Non-Goals

**Goals:**

- Support light mode, dark mode, and system preference with a persistent user override.
- Centralize common visual decisions through CSS custom properties and shared utility/component classes.
- Make Phase 1 pages visually coherent across navigation, dashboard cards, tables, forms, empty states, feedback, and editor shells.
- Keep primary blue as the brand/action color while reducing overuse on repeated actions.
- Preserve existing information architecture, routing, and responsive editor behavior.

**Non-Goals:**

- No API, auth, D1, KV, import/export, browser extension, or sync changes.
- No new design framework or component library.
- No large product workflow redesign beyond visual normalization.
- No storage of secrets or credential material.

## Decisions

### Use CSS custom properties as the token source

Define semantic tokens in `apps/web/src/assets/main.css`, including:

- colors: background, surface, muted surface, elevated surface, text, muted text, border, primary, primary hover, primary soft, danger, focus
- spacing: page padding, section gap, control padding, row padding, form gap, toolbar gap
- radius: control, surface, chip, full
- shadow: surface/elevated overlays
- motion: default transition duration and easing

Rationale: Vue/Tailwind classes can consume CSS variables without introducing a heavy theme runtime. This keeps tokens inspectable, supports dark mode naturally, and avoids scattering raw values across components.

Alternative considered: Tailwind-only design tokens in `@theme`. This is useful for build-time utilities, but runtime theme switching is simpler and more explicit with CSS variables.

### Add VueUse for color mode state

Use `@vueuse/core` `useDark()` and `useToggle()` in the app shell or a small composable to apply a root `dark` class, respect system preference, and persist user choice.

Rationale: VueUse solves browser preference, persistence, and class toggling with a small dependency already appropriate for a Vue application.

Alternative considered: a custom `matchMedia` and `localStorage` implementation. It would be simple but easier to get wrong around hydration, preference updates, and tests.

### Normalize common components before touching pages

Update shared components first:

- `AppButton` and `AppLinkButton`: token-backed tones and focus styles.
- `SearchInput`: token-backed control styling.
- Add small shared controls when useful: input/select/textarea/icon button/badge.
- Existing view components should then compose these controls instead of hand-coding visual primitives.

Rationale: central components reduce drift and make future UI changes cheaper.

Alternative considered: replace only the currently visible hard-coded classes. That would fix symptoms but keep the same maintenance problem.

### Treat repeated open actions as low-emphasis

Use primary style only for create/save/confirm and selected navigation. Service "open" actions appear many times, so they use ghost/link styling with a subtle hover state and external-link affordance.

Rationale: the dashboard should scan as content first, not as a wall of primary buttons.

### Keep responsive behavior but unify visual density

Desktop service/category/tag views keep dense table-like rows. Mobile keeps cards. Both use the same token-backed surfaces, row hover colors, chips, and action controls.

Rationale: this preserves the current responsive model while making it coherent in both themes.

## Risks / Trade-offs

- [Risk] Token migration touches many classes and can miss edge cases. -> Mitigate by updating shared components first, searching for remaining raw color/radius/spacing classes, and validating key pages in both themes.
- [Risk] Dark mode contrast can look correct in code but poor in browser. -> Mitigate with visual checks on home, services, categories, tags, and editor pages.
- [Risk] Adding too many custom components can slow iteration. -> Mitigate by adding only small controls that remove repeated hard-coded visual styling.
- [Risk] Tests that assert class strings may become brittle. -> Mitigate by testing behavior and presence of theme controls instead of exact visual class lists where possible.

## Migration Plan

1. Add the VueUse dependency.
2. Define global tokens and base element styles.
3. Update shared UI components to use token-backed classes.
4. Replace page-level hard-coded visual details in Phase 1 views.
5. Add/update frontend tests for theme toggle and key component behavior.
6. Run `corepack pnpm validate` and `openspec validate --all --strict --no-interactive`.

Rollback is straightforward because the change is frontend-only: revert the dependency, tokens, and component/view class changes.

## Open Questions

- None. The initial theme uses a neutral light/dark base with blue as the only primary emphasis color.
