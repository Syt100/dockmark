# phase-0.4-pr-preview-deployments

## Why
Dockmark pull requests are validated by CI but cannot be opened as live environments before merge. This makes UI/UX work, route behavior, and end-to-end review harder to evaluate from the pull request itself.

## What Changes
- Deploy a non-production Cloudflare Worker preview after validation succeeds for same-repository pull requests.
- Give each pull request a stable aliased Preview URL that is updated by later commits.
- Use dedicated shared preview D1 and KV resources instead of production storage.
- Apply migrations and idempotent demo seed data to the preview D1 before upload.
- Post or update a single GitHub pull request comment containing the preview link and commit information.
- Keep fork pull requests validation-only so Cloudflare deployment secrets are not exposed.

## Out of Scope
- No production deployment behavior changes.
- No production D1 or KV access from preview deployments.
- No per-pull-request D1/KV lifecycle in this first version.
- No automatic Cloudflare Access policy creation; preview URLs contain demo data only and can be protected at the account level separately.
