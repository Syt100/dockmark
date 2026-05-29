## Why

The service navigation UI is now Chinese and responsive, but daily-use workflows still have friction: users need faster filtering, clearer feedback, safer delete confirmations, better form shortcuts, and direct empty-state actions. This change tightens the Phase 1 service navigation experience before moving to import/export or bookmark sync.

## What Changes

- Add service list filters for category, status, and tag.
- Improve Chinese error and success feedback for common management actions.
- Show resource names in delete confirmations for services, categories, and tags.
- Add direct create-service actions to the home empty state.
- Add endpoint quick template buttons in the service editor for common endpoint kinds.
- Improve the mobile service form action area while keeping it in normal document flow.

Non-goals:

- Do not implement JSON import/export, backups, browser bookmark import, or browser extension sync.
- Do not introduce full i18n switching.
- Do not add usage analytics or a “frequently used” ranking model.
- Do not store usernames, passwords, tokens, API keys, OTP seeds, session cookies, or other secrets.

## Capabilities

### New Capabilities

- `phase-1.2-service-navigation-usability`: Defines focused daily-use improvements for filtering, feedback, confirmation, empty states, and service form shortcuts.

### Modified Capabilities

- `phase-1.1-service-navigation-ux`: Extends the existing UX behavior with stronger management usability requirements.

## Impact

- `apps/web`: service list filtering, home empty state action, form shortcuts, confirmation text, feedback helpers, and Web tests.
- `apps/worker`: no API or schema change expected.
- `openspec`: new usability change artifacts.
