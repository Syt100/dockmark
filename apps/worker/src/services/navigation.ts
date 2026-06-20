import type { CategoryInput, ServiceItemInput, TagInput } from '@dockmark/shared'
import { createId } from '@dockmark/shared'

import {
  createCategoryStatement,
  deleteCategoryStatement,
  getCategory,
  updateCategoryStatement,
} from '../db/categories'
import {
  createItemStatements,
  deleteItemStatement,
  getItem,
  updateItemStatements,
} from '../db/items'
import { createTagStatement, deleteTagStatement, getTag, updateTagStatement } from '../db/tags'
import { navCacheVersionIncrementStatement } from '../lib/cache'

type Store = {
  DB: D1Database
}

export async function createCategoryWithNavInvalidation(store: Store, input: CategoryInput) {
  const id = createId('cat')
  await store.DB.batch([
    createCategoryStatement(store.DB, id, input),
    navCacheVersionIncrementStatement(store.DB),
  ])
  const category = await getCategory(store.DB, id)

  if (!category) {
    throw new Error('Created category could not be loaded')
  }

  return category
}

export async function updateCategoryWithNavInvalidation(
  store: Store,
  id: string,
  input: CategoryInput,
) {
  const existing = await getCategory(store.DB, id)

  if (!existing) {
    return null
  }

  await store.DB.batch([
    updateCategoryStatement(store.DB, id, input),
    navCacheVersionIncrementStatement(store.DB),
  ])

  return getCategory(store.DB, id)
}

export async function deleteCategoryWithNavInvalidation(
  store: Store,
  id: string,
): Promise<boolean> {
  const existing = await getCategory(store.DB, id)

  if (!existing) {
    return false
  }

  await store.DB.batch([
    deleteCategoryStatement(store.DB, id),
    navCacheVersionIncrementStatement(store.DB),
  ])

  return true
}

export async function createTagWithNavInvalidation(store: Store, input: TagInput) {
  const id = createId('tag')
  await store.DB.batch([
    createTagStatement(store.DB, id, input),
    navCacheVersionIncrementStatement(store.DB),
  ])
  const tag = await getTag(store.DB, id)

  if (!tag) {
    throw new Error('Created tag could not be loaded')
  }

  return tag
}

export async function updateTagWithNavInvalidation(store: Store, id: string, input: TagInput) {
  const existing = await getTag(store.DB, id)

  if (!existing) {
    return null
  }

  await store.DB.batch([
    updateTagStatement(store.DB, id, input),
    navCacheVersionIncrementStatement(store.DB),
  ])

  return getTag(store.DB, id)
}

export async function deleteTagWithNavInvalidation(store: Store, id: string): Promise<boolean> {
  const existing = await getTag(store.DB, id)

  if (!existing) {
    return false
  }

  await store.DB.batch([
    deleteTagStatement(store.DB, id),
    navCacheVersionIncrementStatement(store.DB),
  ])

  return true
}

export async function createItemWithNavInvalidation(store: Store, input: ServiceItemInput) {
  const id = createId('item')
  await store.DB.batch([
    ...createItemStatements(store.DB, id, input),
    navCacheVersionIncrementStatement(store.DB),
  ])
  const item = await getItem(store.DB, id)

  if (!item) {
    throw new Error('Created item could not be loaded')
  }

  return item
}

export async function updateItemWithNavInvalidation(
  store: Store,
  id: string,
  input: ServiceItemInput,
) {
  const existing = await getItem(store.DB, id)

  if (!existing) {
    return null
  }

  await store.DB.batch([
    ...updateItemStatements(store.DB, id, input),
    navCacheVersionIncrementStatement(store.DB),
  ])

  return getItem(store.DB, id)
}

export async function deleteItemWithNavInvalidation(store: Store, id: string): Promise<boolean> {
  const existing = await getItem(store.DB, id)

  if (!existing) {
    return false
  }

  await store.DB.batch([
    deleteItemStatement(store.DB, id),
    navCacheVersionIncrementStatement(store.DB),
  ])

  return true
}
