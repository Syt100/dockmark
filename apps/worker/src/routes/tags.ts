import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { validateTagInput } from '@dockmark/shared'

import { createTag, deleteTag, listTags, updateTag } from '../db/tags'
import { incrementNavCacheVersion } from '../lib/cache'
import type { AppEnv } from '../lib/env'
import { readJson, requireValidation } from '../lib/http'
import { requireAuth } from '../middleware/auth'

export const tagsRoute = new Hono<AppEnv>()

tagsRoute.get('/', async (c) => {
  const tags = await listTags(c.env.DB)
  return c.json({ tags })
})

tagsRoute.post('/', requireAuth, async (c) => {
  const input = requireValidation(validateTagInput(await readJson(c)))
  const tag = await createTag(c.env.DB, input)
  await incrementNavCacheVersion(c.env.KV)

  return c.json({ tag }, 201)
})

tagsRoute.patch('/:id', requireAuth, async (c) => {
  const input = requireValidation(validateTagInput(await readJson(c)))
  const tag = await updateTag(c.env.DB, c.req.param('id'), input)

  if (!tag) {
    throw new HTTPException(404, { message: 'Tag not found' })
  }

  await incrementNavCacheVersion(c.env.KV)
  return c.json({ tag })
})

tagsRoute.delete('/:id', requireAuth, async (c) => {
  const deleted = await deleteTag(c.env.DB, c.req.param('id'))

  if (!deleted) {
    throw new HTTPException(404, { message: 'Tag not found' })
  }

  await incrementNavCacheVersion(c.env.KV)
  return c.body(null, 204)
})
