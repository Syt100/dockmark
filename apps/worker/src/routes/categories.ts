import { Hono } from 'hono'
import { validateCategoryInput } from '@dockmark/shared'

import { getCategory, listCategories } from '../db/categories'
import { apiError } from '../lib/errors'
import type { AppEnv } from '../lib/env'
import { readJson, requireValidation } from '../lib/http'
import { requireAuth } from '../middleware/auth'
import {
  createCategoryWithNavInvalidation,
  deleteCategoryWithNavInvalidation,
  updateCategoryWithNavInvalidation,
} from '../services/navigation'

export const categoriesRoute = new Hono<AppEnv>()

categoriesRoute.get('/', requireAuth, async (c) => {
  const categories = await listCategories(c.env.DB)
  return c.json({ categories })
})

categoriesRoute.get('/:id', requireAuth, async (c) => {
  const category = await getCategory(c.env.DB, c.req.param('id'))

  if (!category) {
    throw apiError(404, 'not_found', 'Category not found')
  }

  return c.json({ category })
})

categoriesRoute.post('/', requireAuth, async (c) => {
  const input = requireValidation(validateCategoryInput(await readJson(c)))
  const category = await createCategoryWithNavInvalidation(c.env, input)

  return c.json({ category }, 201)
})

categoriesRoute.patch('/:id', requireAuth, async (c) => {
  const input = requireValidation(validateCategoryInput(await readJson(c)))
  const category = await updateCategoryWithNavInvalidation(c.env, c.req.param('id'), input)

  if (!category) {
    throw apiError(404, 'not_found', 'Category not found')
  }

  return c.json({ category })
})

categoriesRoute.delete('/:id', requireAuth, async (c) => {
  const deleted = await deleteCategoryWithNavInvalidation(c.env, c.req.param('id'))

  if (!deleted) {
    throw apiError(404, 'not_found', 'Category not found')
  }

  return c.body(null, 204)
})
