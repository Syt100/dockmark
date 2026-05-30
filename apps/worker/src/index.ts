import { Hono } from 'hono'

import type { HealthResponse, SmokeResponse } from '@dockmark/shared'

import { createAuthAdapter } from './lib/auth'
import { apiError, apiErrorResponseFromUnknown } from './lib/errors'
import type { AppEnv } from './lib/env'
import { authRoute, currentUserHandler } from './routes/auth'
import { categoriesRoute } from './routes/categories'
import { itemsRoute } from './routes/items'
import { navRoute } from './routes/nav'
import { tagsRoute } from './routes/tags'

const app = new Hono<AppEnv>()

app.onError((error) => {
  return apiErrorResponseFromUnknown(error)
})

app.get('/api/health', (c) => {
  const payload: HealthResponse = {
    ok: true,
    service: 'dockmark-worker',
    version: c.env.APP_VERSION,
  }

  return c.json(payload)
})

app.get('/api/smoke', async (c) => {
  const auth = createAuthAdapter(c.env)
  await auth.authenticate(c.req.raw)

  const row = await c.env.DB.prepare('SELECT value FROM app_metadata WHERE key = ?')
    .bind('schema_version')
    .first<{ value: string }>()

  if (!row) {
    throw apiError(500, 'internal_error', 'D1 metadata is not initialized')
  }

  await c.env.KV.put('smoke:last_checked_at', new Date().toISOString())
  const checkedAt = await c.env.KV.get('smoke:last_checked_at')

  if (!checkedAt) {
    throw apiError(500, 'internal_error', 'KV smoke write failed')
  }

  const payload: SmokeResponse = {
    ok: true,
    d1: 'reachable',
    kv: 'reachable',
  }

  return c.json(payload)
})

app.route('/api/categories', categoriesRoute)
app.route('/api/tags', tagsRoute)
app.route('/api/items', itemsRoute)
app.route('/api/nav', navRoute)
app.route('/api/auth', authRoute)
app.get('/api/me', currentUserHandler)

async function serveAssetOrSpaFallback(request: Request, assets: Fetcher): Promise<Response> {
  const assetResponse = await assets.fetch(request)

  if (assetResponse.status !== 404) {
    return assetResponse
  }

  const url = new URL(request.url)
  url.pathname = '/'
  url.search = ''

  return assets.fetch(new Request(url, request))
}

app.on(['GET', 'HEAD'], '*', (c) => {
  if (c.req.path === '/api' || c.req.path.startsWith('/api/')) {
    throw apiError(404, 'not_found', 'Not found')
  }

  return serveAssetOrSpaFallback(c.req.raw, c.env.ASSETS)
})

export default app
