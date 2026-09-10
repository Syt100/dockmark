import { execFileSync } from 'node:child_process'

import { test } from 'vitest'

test('prints the final ServicesView prettier diff', () => {
  execFileSync('corepack', ['pnpm', 'exec', 'prettier', '--write', 'src/views/ServicesView.vue'], {
    cwd: process.cwd(),
    stdio: 'pipe',
  })

  const diff = execFileSync('git', ['diff', '--', 'apps/web/src/views/ServicesView.vue'], {
    cwd: new URL('../../..', import.meta.url),
    encoding: 'utf8',
  })

  console.log(`PRETTIER_DIFF_START\n${diff}\nPRETTIER_DIFF_END`)
})
