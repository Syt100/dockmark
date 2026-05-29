import { Hono } from 'hono'

import { getNavigation } from '../db/items'
import { getCachedNavigation, putCachedNavigation } from '../lib/cache'
import type { AppEnv } from '../lib/env'
import { requireAuth } from '../middleware/auth'

export const navRoute = new Hono<AppEnv>()

navRoute.get('/', requireAuth, async (c) => {
  const cached = await getCachedNavigation(c.env.KV)

  if (cached) {
    return c.json(cached, 200, {
      'X-Dockmark-Cache': 'hit',
    })
  }

  const payload = await getNavigation(c.env.DB)
  await putCachedNavigation(c.env.KV, payload)

  return c.json(payload, 200, {
    'X-Dockmark-Cache': 'miss',
  })
})
