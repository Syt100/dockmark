import { rm } from 'node:fs/promises'
import { resolve } from 'node:path'

const targets = [
  'apps/extension/dist',
  'apps/extension/tsconfig.tsbuildinfo',
  'apps/web/.eslintcache',
  'apps/web/dist',
  'apps/worker/.wrangler',
  'apps/worker/dist',
  'packages/shared/tsconfig.tsbuildinfo',
]

await Promise.all(
  targets.map((target) =>
    rm(resolve(target), {
      force: true,
      recursive: true,
    }),
  ),
)
