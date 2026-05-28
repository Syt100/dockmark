## 1. Workspace Setup

- [x] 1.1 Add root `package.json`, `pnpm-workspace.yaml`, TypeScript config, formatting/linting config, and `.gitignore`.
- [x] 1.2 Create `apps/web`, `apps/worker`, `apps/extension`, `packages/shared`, and `migrations` directories with minimal package boundaries.
- [x] 1.3 Add root pnpm scripts for `dev`, `build`, `typecheck`, `test`, and `validate`.

## 2. Web Baseline

- [x] 2.1 Initialize `apps/web` with Vue 3, TypeScript, Vite, and Vue Router.
- [x] 2.2 Configure Tailwind CSS and global app styles.
- [x] 2.3 Add a minimal app shell that can call the Worker health endpoint.

## 3. Worker Baseline

- [x] 3.1 Initialize `apps/worker` with Hono and typed Cloudflare environment bindings.
- [x] 3.2 Add `/api/health` and basic API error handling.
- [x] 3.3 Configure Worker Assets serving for the web build.

## 4. Auth Foundation

- [x] 4.1 Define an auth adapter interface and normalized authenticated user type.
- [x] 4.2 Add Cloudflare Access and local development auth adapter implementations.
- [x] 4.3 Ensure protected API routes consume the normalized user context instead of raw Access headers.

## 5. D1 and KV Foundation

- [x] 5.1 Add Wrangler configuration for Worker entry, assets, D1, and KV.
- [x] 5.2 Add initial migration file and migration documentation.
- [x] 5.3 Add a small D1/KV binding smoke path or test fixture that validates bindings are typed and reachable locally.

## 6. Verification

- [x] 6.1 Run `pnpm validate`.
- [x] 6.2 Run `openspec validate --specs --strict --no-interactive`.
- [x] 6.3 Document local development and deployment prerequisites in the README.
