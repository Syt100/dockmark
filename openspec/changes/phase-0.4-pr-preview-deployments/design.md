# Design

## Approach
Use Cloudflare Worker version uploads with aliased Preview URLs for pull requests. Preview deployment runs only after the existing validation job succeeds and only for pull requests whose head repository is `Syt100/dockmark`.

## Preview Worker
- Use a generated Wrangler configuration with Worker name `dockmark-preview`.
- Keep `AUTH_MODE=development` so reviewers can open the preview without provisioning Dockmark accounts.
- Upload with `wrangler versions upload --preview-alias pr-<number>` so each pull request keeps a stable URL across commits.
- Normal preview updates SHALL use version upload and SHALL NOT change production traffic.
- The isolated `dockmark-preview` Worker is already initialized; the workflow SHALL NOT contain first-run bootstrap deployment logic.

## Preview Storage
Use one D1 database per pull request and one shared non-production KV namespace:
- D1 database: `dockmark-preview-pr-<number>`
- KV namespace: `dockmark-preview`

The workflow SHALL resolve or create the pull-request D1 and shared KV resources and write a generated Wrangler config containing their IDs. Preview migrations and demo seed data SHALL run against the pull-request D1 only.

When the pull request is closed, whether merged or not, CI SHALL delete only that pull request's D1 database. Cleanup SHALL be idempotent when the database is already absent.

The existing local demo seed is idempotent and contains no secrets. For remote D1 execution, the workflow SHALL create a temporary seed copy without explicit SQL `BEGIN TRANSACTION` / `COMMIT` statements because remote D1 imports manage their own transaction boundary.

## GitHub Feedback
After upload, the workflow SHALL add or update one bot-authored PR comment identified by a stable marker. The comment SHALL include:
- Preview readiness
- Preview URL
- Short pull-request head commit SHA
- Isolated preview D1 name

Later commits SHALL update the same comment rather than create duplicates.

The preview build may continue to use GitHub's pull-request merge ref so reviewers see the pull request integrated with the current base branch, but version metadata and the PR comment SHALL identify `github.event.pull_request.head.sha`, not the temporary merge commit SHA.

## Security
- Fork PRs SHALL never execute the preview deployment or cleanup jobs.
- Preview SHALL not bind production D1 or KV.
- Preview SHALL use development auth and demo data only.
- Production deployment behavior and secrets remain unchanged.
