## 1. Extension Build Foundation

- [x] 1.1 Add typed manifest metadata and background entrypoint.
- [x] 1.2 Add a deterministic build script that emits `dist/manifest.json` and compiled background JavaScript.
- [x] 1.3 Update package scripts to run build, typecheck, lint check, and tests.

## 2. Extension Tests

- [x] 2.1 Add tests for manifest version, identity, and background script reference.
- [x] 2.2 Add tests proving host permissions and bookmark permissions are not requested in the foundation milestone.

## 3. Verification

- [ ] 3.1 Run extension tests and build.
- [ ] 3.2 Run `corepack pnpm validate`.
- [ ] 3.3 Run `openspec validate --all --strict --no-interactive`.
