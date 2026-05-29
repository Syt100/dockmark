import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'

import type { HealthResponse, SmokeResponse } from '@dockmark/shared'

import { createAuthAdapter } from './lib/auth'
import type { AppEnv } from './lib/env'
import { categoriesRoute } from './routes/categories'
import { itemsRoute } from './routes/items'
import { navRoute } from './routes/nav'
import { tagsRoute } from './routes/tags'

const app = new Hono<AppEnv>()

app.onError((error, c) => {
  if (error instanceof HTTPException) {
    return error.getResponse()
  }

  console.error(error)

  return c.json({ error: 'Internal Server Error' }, 500)
})

app.get('/api/health', (c) => {
  const payload: HealthResponse = {
    ok: true,
    service: 'dockmark-worker',
    version: c.env.APP_VERSION,
  }

  return c.json(payload)
})

app.get('/api/me', async (c) => {
  const auth = createAuthAdapter(c.env)
  const user = await auth.authenticate(c.req.raw)

  return c.json({ user })
})

app.get('/api/smoke', async (c) => {
  const auth = createAuthAdapter(c.env)
  await auth.authenticate(c.req.raw)

  const row = await c.env.DB.prepare('SELECT value FROM app_metadata WHERE key = ?')
    .bind('schema_version')
    .first<{ value: string }>()

  if (!row) {
    throw new HTTPException(500, { message: 'D1 metadata is not initialized' })
  }

  await c.env.KV.put('smoke:last_checked_at', new Date().toISOString())
  const checkedAt = await c.env.KV.get('smoke:last_checked_at')

  if (!checkedAt) {
    throw new HTTPException(500, { message: 'KV smoke write failed' })
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
    throw new HTTPException(404, { message: 'Not found' })
  }

  return serveAssetOrSpaFallback(c.req.raw, c.env.ASSETS)
})

export default app
