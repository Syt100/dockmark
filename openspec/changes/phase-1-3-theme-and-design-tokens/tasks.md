## 1. Theme Foundation

- [x] 1.1 Add `@vueuse/core` to the web app dependency set.
- [x] 1.2 Define global CSS design tokens for light and dark color, spacing, radius, shadow, focus, density, and motion.
- [x] 1.3 Add a persistent light/dark/system-aware theme toggle to the application shell.

## 2. Shared Components

- [x] 2.1 Update `AppButton`, `AppLinkButton`, and `SearchInput` to use token-backed styles.
- [x] 2.2 Add shared controls for inputs, selects, textareas, badges, and icon buttons where they remove repeated page-level styling.
- [x] 2.3 Normalize feedback, page header, and editor shell styling against the shared token system.

## 3. Page Normalization

- [x] 3.1 Update the home page to use theme-aware cards and low-emphasis repeated open actions.
- [x] 3.2 Update services, categories, and tags list pages to use consistent dense desktop rows and mobile cards.
- [x] 3.3 Update service, category, and tag editor pages to use shared form controls and token-backed spacing.
- [x] 3.4 Update the about page and any remaining Phase 1 surfaces to avoid hard-coded light-only styling.

## 4. Verification

- [x] 4.1 Add or update frontend tests for theme toggling and shared component behavior.
- [x] 4.2 Run `corepack pnpm validate`.
- [x] 4.3 Run `openspec validate --all --strict --no-interactive`.
