## 1. Motion foundation
- [x] Add shared motion tokens in `apps/web/src/assets/main.css`
- [x] Add shared Vue transition classes for fade, panel, list, feedback, and disclosure
- [x] Add `prefers-reduced-motion` handling

## 2. App shell and overlays
- [x] Add route content transition in `App.vue`
- [x] Add confirmation dialog transition in `ConfirmAction.vue`
- [x] Add desktop editor overlay/panel transition in `ResponsiveEditorShell.vue`

## 3. Lists, cards, and feedback
- [x] Keep filter-driven home cards stable without list transition groups
- [x] Keep service, category, and tag management lists stable without filter-driven transition groups
- [x] Add feedback message transition

## 4. Dynamic controls
- [x] Add mobile service filter disclosure transition
- [x] Add endpoint row transition in `ServiceEditorView.vue`

## 5. Verification
- [x] Run frontend tests
- [x] Add or update focused tests where transition wrappers affect rendering behavior
- [x] Run `corepack pnpm validate`
- [x] Run `openspec validate --all --strict --no-interactive`
