import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { validateServiceItemInput } from '@dockmark/shared'

import { createItem, deleteItem, getItem, listItems, updateItem } from '../db/items'
import { incrementNavCacheVersion } from '../lib/cache'
import type { AppEnv } from '../lib/env'
import { readJson, requireValidation } from '../lib/http'
import { requireAuth } from '../middleware/auth'

export const itemsRoute = new Hono<AppEnv>()

itemsRoute.get('/', requireAuth, async (c) => {
  const items = await listItems(c.env.DB)
  return c.json({ items })
})

itemsRoute.post('/', requireAuth, async (c) => {
  const input = requireValidation(validateServiceItemInput(await readJson(c)))
  const item = await createItem(c.env.DB, input)
  await incrementNavCacheVersion(c.env.KV)

  return c.json({ item }, 201)
})

itemsRoute.get('/:id', requireAuth, async (c) => {
  const item = await getItem(c.env.DB, c.req.param('id'))

  if (!item) {
    throw new HTTPException(404, { message: 'Item not found' })
  }

  return c.json({ item })
})

itemsRoute.patch('/:id', requireAuth, async (c) => {
  const input = requireValidation(validateServiceItemInput(await readJson(c)))
  const item = await updateItem(c.env.DB, c.req.param('id'), input)

  if (!item) {
    throw new HTTPException(404, { message: 'Item not found' })
  }

  await incrementNavCacheVersion(c.env.KV)
  return c.json({ item })
})

itemsRoute.delete('/:id', requireAuth, async (c) => {
  const deleted = await deleteItem(c.env.DB, c.req.param('id'))

  if (!deleted) {
    throw new HTTPException(404, { message: 'Item not found' })
  }

  await incrementNavCacheVersion(c.env.KV)
  return c.body(null, 204)
})
