import { createMiddleware } from 'hono/factory'

import { createAuthAdapter } from '../lib/auth'
import type { AppEnv } from '../lib/env'

export const requireAuth = createMiddleware<AppEnv>(async (c, next) => {
  const auth = createAuthAdapter(c.env)
  const user = await auth.authenticate(c.req.raw)
  c.set('user', user)

  await next()
})
