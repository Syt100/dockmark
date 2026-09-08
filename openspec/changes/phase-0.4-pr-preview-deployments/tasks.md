# Tasks

- [x] Add a preview Worker configuration path that never references production D1 or KV.
- [x] Add a resource-resolution helper for the shared preview D1 and KV namespace.
- [x] Extend the Cloudflare GitHub Actions workflow with a same-repository PR preview job after validation.
- [x] Apply remote preview migrations and idempotent demo seed data before upload.
- [x] Upload a version with a stable `pr-<number>` preview alias.
- [x] Add or update one PR comment with the preview URL and commit SHA.
- [x] Keep fork pull requests validation-only and preserve production deployment behavior.
- [x] Run workspace validation, Cloudflare type generation checks, and deploy dry run.
- [ ] Run `openspec validate --all --strict --no-interactive` before merge in an environment with the OpenSpec CLI available.
