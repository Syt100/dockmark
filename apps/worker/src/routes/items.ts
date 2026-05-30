import { Hono } from 'hono'
import { validateServiceItemInput } from '@dockmark/shared'

import { getItem, listItems } from '../db/items'
import { apiError } from '../lib/errors'
import type { AppEnv } from '../lib/env'
import { readJson, requireValidation } from '../lib/http'
import { requireAuth } from '../middleware/auth'
import {
  createItemWithNavInvalidation,
  deleteItemWithNavInvalidation,
  updateItemWithNavInvalidation,
} from '../services/navigation'

export const itemsRoute = new Hono<AppEnv>()

itemsRoute.get('/', requireAuth, async (c) => {
  const items = await listItems(c.env.DB)
  return c.json({ items })
})

itemsRoute.post('/', requireAuth, async (c) => {
  const input = requireValidation(validateServiceItemInput(await readJson(c)))
  const item = await createItemWithNavInvalidation(c.env, input)

  return c.json({ item }, 201)
})

itemsRoute.get('/:id', requireAuth, async (c) => {
  const item = await getItem(c.env.DB, c.req.param('id'))

  if (!item) {
    throw apiError(404, 'not_found', 'Item not found')
  }

  return c.json({ item })
})

itemsRoute.patch('/:id', requireAuth, async (c) => {
  const input = requireValidation(validateServiceItemInput(await readJson(c)))
  const item = await updateItemWithNavInvalidation(c.env, c.req.param('id'), input)

  if (!item) {
    throw apiError(404, 'not_found', 'Item not found')
  }

  return c.json({ item })
})

itemsRoute.delete('/:id', requireAuth, async (c) => {
  const deleted = await deleteItemWithNavInvalidation(c.env, c.req.param('id'))

  if (!deleted) {
    throw apiError(404, 'not_found', 'Item not found')
  }

  return c.body(null, 204)
})
