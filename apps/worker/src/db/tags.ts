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
  const slug = input.slug || slugify(input.name)

  await db.prepare('INSERT INTO tags (id, name, slug) VALUES (?, ?, ?)').bind(id, input.name, slug).run()

  const tag = await getTag(db, id)

  if (!tag) {
    throw new Error('Created tag could not be loaded')
  }

  return tag
}

export async function deleteTag(db: D1Database, id: string): Promise<boolean> {
  const result = await db.prepare('DELETE FROM tags WHERE id = ?').bind(id).run()
  return result.meta.changes > 0
}

