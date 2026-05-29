import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { validateCategoryInput } from '@dockmark/shared'

import {
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory,
} from '../db/categories'
import { incrementNavCacheVersion } from '../lib/cache'
import type { AppEnv } from '../lib/env'
import { readJson, requireValidation } from '../lib/http'
import { requireAuth } from '../middleware/auth'

export const categoriesRoute = new Hono<AppEnv>()

categoriesRoute.get('/', async (c) => {
  const categories = await listCategories(c.env.DB)
  return c.json({ categories })
})

categoriesRoute.post('/', requireAuth, async (c) => {
  const input = requireValidation(validateCategoryInput(await readJson(c)))
  const category = await createCategory(c.env.DB, input)
  await incrementNavCacheVersion(c.env.KV)

  return c.json({ category }, 201)
})

categoriesRoute.patch('/:id', requireAuth, async (c) => {
  const input = requireValidation(validateCategoryInput(await readJson(c)))
  const category = await updateCategory(c.env.DB, c.req.param('id'), input)

  if (!category) {
    throw new HTTPException(404, { message: 'Category not found' })
  }

  await incrementNavCacheVersion(c.env.KV)
  return c.json({ category })
})

categoriesRoute.delete('/:id', requireAuth, async (c) => {
  const deleted = await deleteCategory(c.env.DB, c.req.param('id'))

  if (!deleted) {
    throw new HTTPException(404, { message: 'Category not found' })
  }

  await incrementNavCacheVersion(c.env.KV)
  return c.body(null, 204)
})

