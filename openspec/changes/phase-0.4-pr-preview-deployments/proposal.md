# phase-0.4-pr-preview-deployments

## Why
Dockmark pull requests are validated by CI but cannot be opened as live environments before merge. This makes UI/UX work, route behavior, and end-to-end review harder to evaluate from the pull request itself.

## What Changes
- Deploy a non-production Cloudflare Worker preview after validation succeeds for same-repository pull requests.
- Give each pull request a stable aliased Preview URL that is updated by later commits.
- Give each pull request its own non-production D1 database while continuing to share one non-production KV namespace.
- Apply migrations and idempotent demo seed data to the pull-request D1 before upload.
- Delete the pull-request D1 automatically when the pull request is closed or merged.
- Post or update a single GitHub pull request comment containing the preview link, the real PR head commit, and the preview D1 name.
- Keep fork pull requests validation-only so Cloudflare deployment secrets are not exposed.

## Out of Scope
- No production deployment behavior changes.
- No production D1 or KV access from preview deployments.
- No per-pull-request KV lifecycle in this version.
- No automatic Cloudflare Access policy creation; preview URLs contain demo data only and can be protected at the account level separately.
