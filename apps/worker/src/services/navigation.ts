import type { CategoryInput, ServiceItemInput, TagInput } from '@dockmark/shared'

import { createCategory, deleteCategory, updateCategory } from '../db/categories'
import { createItem, deleteItem, updateItem } from '../db/items'
import { createTag, deleteTag, updateTag } from '../db/tags'
import { incrementNavCacheVersion } from '../lib/cache'

type Store = {
  DB: D1Database
}

export async function createCategoryWithNavInvalidation(store: Store, input: CategoryInput) {
  const category = await createCategory(store.DB, input)
  await incrementNavCacheVersion(store.DB)
  return category
}

export async function updateCategoryWithNavInvalidation(store: Store, id: string, input: CategoryInput) {
  const category = await updateCategory(store.DB, id, input)

  if (category) {
    await incrementNavCacheVersion(store.DB)
  }

  return category
}

export async function deleteCategoryWithNavInvalidation(store: Store, id: string): Promise<boolean> {
  const deleted = await deleteCategory(store.DB, id)

  if (deleted) {
    await incrementNavCacheVersion(store.DB)
  }

  return deleted
}

export async function createTagWithNavInvalidation(store: Store, input: TagInput) {
  const tag = await createTag(store.DB, input)
  await incrementNavCacheVersion(store.DB)
  return tag
}

export async function updateTagWithNavInvalidation(store: Store, id: string, input: TagInput) {
  const tag = await updateTag(store.DB, id, input)

  if (tag) {
    await incrementNavCacheVersion(store.DB)
  }

  return tag
}

export async function deleteTagWithNavInvalidation(store: Store, id: string): Promise<boolean> {
  const deleted = await deleteTag(store.DB, id)

  if (deleted) {
    await incrementNavCacheVersion(store.DB)
  }

  return deleted
}

export async function createItemWithNavInvalidation(store: Store, input: ServiceItemInput) {
  const item = await createItem(store.DB, input)
  await incrementNavCacheVersion(store.DB)
  return item
}

export async function updateItemWithNavInvalidation(store: Store, id: string, input: ServiceItemInput) {
  const item = await updateItem(store.DB, id, input)

  if (item) {
    await incrementNavCacheVersion(store.DB)
  }

  return item
}

export async function deleteItemWithNavInvalidation(store: Store, id: string): Promise<boolean> {
  const deleted = await deleteItem(store.DB, id)

  if (deleted) {
    await incrementNavCacheVersion(store.DB)
  }

  return deleted
}
