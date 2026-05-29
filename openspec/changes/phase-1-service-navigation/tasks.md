## 1. Schema and Shared Contracts

- [x] 1.1 Add Phase 1 D1 migrations for categories, items, endpoints, tags, and item_tags.
- [x] 1.2 Add shared TypeScript types and validation schemas for categories, items, endpoints, tags, and navigation payloads.
- [x] 1.3 Add tests for endpoint primary selection and validation rules.

## 2. Worker Data Layer

- [x] 2.1 Add D1 repository functions for categories, items, endpoints, tags, and item_tags using prepared statements.
- [x] 2.2 Enforce endpoint-only URL storage and one primary endpoint per active service.
- [x] 2.3 Add repository tests or integration tests for create, update, delete, and list behavior.

## 3. Worker API

- [x] 3.1 Implement `/api/categories` list/create/update/delete.
- [x] 3.2 Implement `/api/tags` list/create/delete.
- [x] 3.3 Implement `/api/items` list/create/detail/update/delete with endpoints and tags.
- [x] 3.4 Implement consistent validation and error responses for navigation APIs.

## 4. Navigation Cache

- [x] 4.1 Implement versioned KV cache keys for `/api/nav`.
- [x] 4.2 Invalidate navigation cache version after category, item, endpoint, or tag writes.
- [x] 4.3 Add regression tests for cache hit, cache miss, and invalidation behavior.

## 5. Web UI

- [x] 5.1 Add home navigation page grouped by category with service cards, primary endpoint, alternate endpoints, tags, and credential hints.
- [x] 5.2 Add service management views for list, create, edit, and delete.
- [x] 5.3 Add category management view.
- [x] 5.4 Add basic tag management view.
- [x] 5.5 Add service search by name, description, endpoint URL, category, and tag.

## 6. Credential Safety

- [x] 6.1 Label credential guidance fields as lookup hints, not stored credentials.
- [x] 6.2 Ensure forms and API schemas do not include password, token, API key, OTP seed, or session cookie fields.

## 7. Verification

- [x] 7.1 Run `pnpm validate`.
- [x] 7.2 Run navigation API tests.
- [x] 7.3 Run `openspec validate --all --strict --no-interactive`.
- [x] 7.4 Smoke test creating a category, service, endpoints, tags, and loading `/api/nav`.
