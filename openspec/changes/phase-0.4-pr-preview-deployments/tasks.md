# Tasks

- [x] Add a preview Worker configuration path that never references production D1 or KV.
- [x] Add resource resolution for pull-request D1 and shared preview KV.
- [x] Extend the Cloudflare GitHub Actions workflow with a same-repository PR preview job after validation.
- [x] Apply remote preview migrations and idempotent demo seed data before upload.
- [x] Upload a version with a stable `pr-<number>` preview alias.
- [x] Report the real pull-request head SHA in Preview metadata and the PR comment.
- [x] Create one isolated `dockmark-preview-pr-<number>` D1 database per pull request.
- [x] Delete the pull-request D1 automatically on PR close or merge.
- [x] Remove first-run preview Worker bootstrap deployment logic now that the Worker exists.
- [x] Keep fork pull requests validation-only and preserve production deployment behavior.
- [x] Run workspace validation, Cloudflare type generation checks, and deploy dry run.
- [ ] Run `openspec validate --all --strict --no-interactive` before merge in an environment with the OpenSpec CLI available.
