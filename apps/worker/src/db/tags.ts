import { createId, slugify, type Tag, type TagInput } from '@dockmark/shared'

import { mapTag, type TagRow } from './rows'

export async function listTags(db: D1Database): Promise<Tag[]> {
  const result = await db.prepare('SELECT * FROM tags ORDER BY name COLLATE NOCASE ASC').all<TagRow>()
  return result.results.map(mapTag)
}

export async function getTag(db: D1Database, id: string): Promise<Tag | null> {
  const row = await db.prepare('SELECT * FROM tags WHERE id = ?').bind(id).first<TagRow>()
  return row ? mapTag(row) : null
}

export async function createTag(db: D1Database, input: TagInput): Promise<Tag> {
  const id = createId('tag')

  await db.batch([createTagStatement(db, id, input)])

  const tag = await getTag(db, id)

  if (!tag) {
    throw new Error('Created tag could not be loaded')
  }

  return tag
}

export function createTagStatement(db: D1Database, id: string, input: TagInput): D1PreparedStatement {
  const slug = input.slug || slugify(input.name)

  return db.prepare('INSERT INTO tags (id, name, slug) VALUES (?, ?, ?)').bind(id, input.name, slug)
}

export async function updateTag(db: D1Database, id: string, input: TagInput): Promise<Tag | null> {
  const result = await updateTagStatement(db, id, input).run()

  if (result.meta.changes === 0) {
    return null
  }

  return getTag(db, id)
}

export function updateTagStatement(db: D1Database, id: string, input: TagInput): D1PreparedStatement {
  const slug = input.slug || slugify(input.name)

  return db
    .prepare('UPDATE tags SET name = ?, slug = ? WHERE id = ?')
    .bind(input.name, slug, id)
}

export async function deleteTag(db: D1Database, id: string): Promise<boolean> {
  const result = await deleteTagStatement(db, id).run()
  return result.meta.changes > 0
}

export function deleteTagStatement(db: D1Database, id: string): D1PreparedStatement {
  return db.prepare('DELETE FROM tags WHERE id = ?').bind(id)
}
