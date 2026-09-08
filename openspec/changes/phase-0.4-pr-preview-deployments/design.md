# Design

## Approach
Use Cloudflare Worker version uploads with aliased Preview URLs for pull requests. Preview deployment runs only after the existing validation job succeeds and only for pull requests whose head repository is `Syt100/dockmark`.

## Preview Worker
- Use a generated Wrangler configuration with Worker name `dockmark-preview`.
- Keep `AUTH_MODE=development` so reviewers can open the preview without provisioning Dockmark accounts.
- Upload with `wrangler versions upload --preview-alias pr-<number>` so each pull request keeps a stable URL across commits.
- Normal preview updates SHALL use version upload and SHALL NOT change production traffic.
- Because Cloudflare cannot upload a version for a Worker that does not yet exist, the workflow MAY perform one initial `wrangler deploy` for the isolated `dockmark-preview` Worker only. After this bootstrap, subsequent PR previews use version uploads.

## Preview Storage
Use shared non-production resources:
- D1 database: `dockmark-preview`
- KV namespace: `dockmark-preview`

The workflow SHALL resolve or create these resources and write a generated Wrangler config containing their IDs. Preview migrations and demo seed data SHALL run against `dockmark-preview` only.

The existing local demo seed is idempotent and contains no secrets. For remote D1 execution, the workflow SHALL create a temporary seed copy without explicit SQL `BEGIN TRANSACTION` / `COMMIT` statements because remote D1 imports manage their own transaction boundary.

## GitHub Feedback
After upload, the workflow SHALL add or update one bot-authored PR comment identified by a stable marker. The comment SHALL include:
- Preview readiness
- Preview URL
- Short commit SHA

Later commits SHALL update the same comment rather than create duplicates.

## Security
- Fork PRs SHALL never execute the preview deployment job.
- Preview SHALL not bind production D1 or KV.
- Preview SHALL use development auth and demo data only.
- Production deployment behavior and secrets remain unchanged.
