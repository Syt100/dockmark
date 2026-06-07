## 1. Shared Validation And Form Mapping

- [x] 1.1 Add shared validation coverage for icon type/value combinations, especially invalid direct image URLs.
- [x] 1.2 Preserve `iconType` in service editor form state and form-to-input mapping tests.

## 2. Web Icon Rendering

- [x] 2.1 Implement a reusable service icon component with emoji/text, URL image, favicon, and fallback rendering.
- [x] 2.2 Add focused component tests for favicon derivation, image URL rendering, and fallback behavior.

## 3. Service Editing And Navigation UI

- [x] 3.1 Add icon mode controls and live preview to the service editor.
- [x] 3.2 Replace inline service icon rendering in home cards and service management rows with the shared component.
- [x] 3.3 Update local development seed data to include non-emoji icon examples.

## 4. Validation

- [x] 4.1 Run focused shared and web tests for service icon behavior.
- [x] 4.2 Run `corepack pnpm validate` and `openspec validate --all --strict --no-interactive`.
