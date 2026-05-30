import { Hono } from 'hono'
import { validateTagInput } from '@dockmark/shared'

import { listTags } from '../db/tags'
import { apiError } from '../lib/errors'
import type { AppEnv } from '../lib/env'
import { readJson, requireValidation } from '../lib/http'
import { requireAuth } from '../middleware/auth'
import {
  createTagWithNavInvalidation,
  deleteTagWithNavInvalidation,
  updateTagWithNavInvalidation,
} from '../services/navigation'

export const tagsRoute = new Hono<AppEnv>()

tagsRoute.get('/', requireAuth, async (c) => {
  const tags = await listTags(c.env.DB)
  return c.json({ tags })
})

tagsRoute.post('/', requireAuth, async (c) => {
  const input = requireValidation(validateTagInput(await readJson(c)))
  const tag = await createTagWithNavInvalidation(c.env, input)

  return c.json({ tag }, 201)
})

tagsRoute.patch('/:id', requireAuth, async (c) => {
  const input = requireValidation(validateTagInput(await readJson(c)))
  const tag = await updateTagWithNavInvalidation(c.env, c.req.param('id'), input)

  if (!tag) {
    throw apiError(404, 'not_found', 'Tag not found')
  }

  return c.json({ tag })
})

tagsRoute.delete('/:id', requireAuth, async (c) => {
  const deleted = await deleteTagWithNavInvalidation(c.env, c.req.param('id'))

  if (!deleted) {
    throw apiError(404, 'not_found', 'Tag not found')
  }

  return c.body(null, 204)
})
