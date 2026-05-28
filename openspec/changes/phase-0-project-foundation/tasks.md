## 1. Workspace Setup

- [ ] 1.1 Add root `package.json`, `pnpm-workspace.yaml`, TypeScript config, formatting/linting config, and `.gitignore`.
- [ ] 1.2 Create `apps/web`, `apps/worker`, `apps/extension`, `packages/shared`, and `migrations` directories with minimal package boundaries.
- [ ] 1.3 Add root pnpm scripts for `dev`, `build`, `typecheck`, `test`, and `validate`.

## 2. Web Baseline

- [ ] 2.1 Initialize `apps/web` with Vue 3, TypeScript, Vite, and Vue Router.
- [ ] 2.2 Configure Tailwind CSS and global app styles.
- [ ] 2.3 Add a minimal app shell that can call the Worker health endpoint.

## 3. Worker Baseline

- [ ] 3.1 Initialize `apps/worker` with Hono and typed Cloudflare environment bindings.
- [ ] 3.2 Add `/api/health` and basic API error handling.
- [ ] 3.3 Configure Worker Assets serving for the web build.

## 4. Auth Foundation

- [ ] 4.1 Define an auth adapter interface and normalized authenticated user type.
- [ ] 4.2 Add Cloudflare Access and local development auth adapter implementations.
- [ ] 4.3 Ensure protected API routes consume the normalized user context instead of raw Access headers.

## 5. D1 and KV Foundation

- [ ] 5.1 Add Wrangler configuration for Worker entry, assets, D1, and KV.
- [ ] 5.2 Add initial migration file and migration documentation.
- [ ] 5.3 Add a small D1/KV binding smoke path or test fixture that validates bindings are typed and reachable locally.

## 6. Verification

- [ ] 6.1 Run `pnpm validate`.
- [ ] 6.2 Run `openspec validate --specs --strict --no-interactive`.
- [ ] 6.3 Document local development and deployment prerequisites in the README.

