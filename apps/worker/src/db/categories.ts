import { createId, slugify, type Category, type CategoryInput } from '@dockmark/shared'

import { mapCategory, type CategoryRow } from './rows'

export async function listCategories(db: D1Database): Promise<Category[]> {
  const result = await db
    .prepare('SELECT * FROM categories ORDER BY sort_order ASC, name COLLATE NOCASE ASC')
    .all<CategoryRow>()

  return result.results.map(mapCategory)
}

export async function getCategory(db: D1Database, id: string): Promise<Category | null> {
  const row = await db
    .prepare('SELECT * FROM categories WHERE id = ?')
    .bind(id)
    .first<CategoryRow>()
  return row ? mapCategory(row) : null
}

export async function createCategory(db: D1Database, input: CategoryInput): Promise<Category> {
  const id = createId('cat')

  await db.batch([createCategoryStatement(db, id, input)])

  const category = await getCategory(db, id)

  if (!category) {
    throw new Error('Created category could not be loaded')
  }

  return category
}

export function createCategoryStatement(
  db: D1Database,
  id: string,
  input: CategoryInput,
): D1PreparedStatement {
  const slug = input.slug || slugify(input.name)

  return db
    .prepare(
      `INSERT INTO categories (id, name, slug, icon, color, sort_order)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .bind(id, input.name, slug, input.icon ?? null, input.color ?? null, input.sortOrder ?? 0)
}

export async function updateCategory(
  db: D1Database,
  id: string,
  input: CategoryInput,
): Promise<Category | null> {
  const result = await updateCategoryStatement(db, id, input).run()

  if (result.meta.changes === 0) {
    return null
  }

  return getCategory(db, id)
}

export function updateCategoryStatement(
  db: D1Database,
  id: string,
  input: CategoryInput,
): D1PreparedStatement {
  const slug = input.slug || slugify(input.name)

  return db
    .prepare(
      `UPDATE categories
       SET name = ?, slug = ?, icon = ?, color = ?, sort_order = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
    )
    .bind(input.name, slug, input.icon ?? null, input.color ?? null, input.sortOrder ?? 0, id)
}

export async function deleteCategory(db: D1Database, id: string): Promise<boolean> {
  const result = await deleteCategoryStatement(db, id).run()
  return result.meta.changes > 0
}

export function deleteCategoryStatement(db: D1Database, id: string): D1PreparedStatement {
  return db.prepare('DELETE FROM categories WHERE id = ?').bind(id)
}
