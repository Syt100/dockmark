# Tasks

- [ ] Add a preview Worker configuration path that never references production D1 or KV.
- [ ] Add a resource-resolution helper for the shared preview D1 and KV namespace.
- [ ] Extend the Cloudflare GitHub Actions workflow with a same-repository PR preview job after validation.
- [ ] Apply remote preview migrations and idempotent demo seed data before upload.
- [ ] Upload a version with a stable `pr-<number>` preview alias.
- [ ] Add or update one PR comment with the preview URL and commit SHA.
- [ ] Keep fork pull requests validation-only and preserve production deployment behavior.
- [ ] Run workspace validation, Cloudflare type generation checks, deploy dry run, and OpenSpec validation.
