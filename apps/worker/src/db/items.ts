import {
  buildNavItem,
  createId,
  type Endpoint,
  type NavResponse,
  type ServiceItem,
  type ServiceItemInput,
  type Tag,
} from '@dockmark/shared'

import { listCategories } from './categories'
import {
  mapEndpoint,
  mapServiceItem,
  mapTag,
  type EndpointRow,
  type ItemRow,
  type TagRow,
} from './rows'

async function listEndpointsForItems(db: D1Database, itemIds: string[]): Promise<Map<string, Endpoint[]>> {
  const map = new Map<string, Endpoint[]>()

  if (itemIds.length === 0) {
    return map
  }

  const placeholders = itemIds.map(() => '?').join(', ')
  const result = await db
    .prepare(
      `SELECT * FROM endpoints
       WHERE item_id IN (${placeholders})
       ORDER BY sort_order ASC, label COLLATE NOCASE ASC`,
    )
    .bind(...itemIds)
    .all<EndpointRow>()

  for (const row of result.results) {
    const endpoint = mapEndpoint(row)
    const endpoints = map.get(endpoint.itemId) ?? []
    endpoints.push(endpoint)
    map.set(endpoint.itemId, endpoints)
  }

  return map
}

async function listTagsForItems(db: D1Database, itemIds: string[]): Promise<Map<string, Tag[]>> {
  const map = new Map<string, Tag[]>()

  if (itemIds.length === 0) {
    return map
  }

  const placeholders = itemIds.map(() => '?').join(', ')
  const result = await db
    .prepare(
      `SELECT item_tags.item_id, tags.*
       FROM item_tags
       JOIN tags ON tags.id = item_tags.tag_id
       WHERE item_tags.item_id IN (${placeholders})
       ORDER BY tags.name COLLATE NOCASE ASC`,
    )
    .bind(...itemIds)
    .all<TagRow & { item_id: string }>()

  for (const row of result.results) {
    const tag = mapTag(row)
    const tags = map.get(row.item_id) ?? []
    tags.push(tag)
    map.set(row.item_id, tags)
  }

  return map
}

async function hydrateItems(db: D1Database, rows: ItemRow[]): Promise<ServiceItem[]> {
  const ids = rows.map((row) => row.id)
  const endpointsByItem = await listEndpointsForItems(db, ids)
  const tagsByItem = await listTagsForItems(db, ids)

  return rows.map((row) => mapServiceItem(row, endpointsByItem.get(row.id) ?? [], tagsByItem.get(row.id) ?? []))
}

function replaceItemChildrenStatements(db: D1Database, itemId: string, input: ServiceItemInput): D1PreparedStatement[] {
  const deleteStatements = [
    db.prepare('DELETE FROM endpoints WHERE item_id = ?').bind(itemId),
    db.prepare('DELETE FROM item_tags WHERE item_id = ?').bind(itemId),
  ]

  const endpointStatements = input.endpoints.map((endpoint, index) =>
    db
      .prepare(
        `INSERT INTO endpoints (id, item_id, label, url, kind, is_primary, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        endpoint.id || createId('end'),
        itemId,
        endpoint.label,
        endpoint.url,
        endpoint.kind ?? 'public',
        endpoint.isPrimary ? 1 : 0,
        endpoint.sortOrder ?? index,
      ),
  )

  const tagStatements = (input.tagIds ?? []).map((tagId) =>
    db.prepare('INSERT OR IGNORE INTO item_tags (item_id, tag_id) VALUES (?, ?)').bind(itemId, tagId),
  )

  return [...deleteStatements, ...endpointStatements, ...tagStatements]
}

export async function listItems(db: D1Database): Promise<ServiceItem[]> {
  const result = await db
    .prepare('SELECT * FROM items ORDER BY sort_order ASC, name COLLATE NOCASE ASC')
    .all<ItemRow>()

  return hydrateItems(db, result.results)
}

export async function getItem(db: D1Database, id: string): Promise<ServiceItem | null> {
  const row = await db.prepare('SELECT * FROM items WHERE id = ?').bind(id).first<ItemRow>()

  if (!row) {
    return null
  }

  const [item] = await hydrateItems(db, [row])
  return item ?? null
}

export async function createItem(db: D1Database, input: ServiceItemInput): Promise<ServiceItem> {
  const id = createId('item')

  await db.batch(createItemStatements(db, id, input))

  const item = await getItem(db, id)

  if (!item) {
    throw new Error('Created item could not be loaded')
  }

  return item
}

export function createItemStatements(db: D1Database, id: string, input: ServiceItemInput): D1PreparedStatement[] {
  return [
    db
      .prepare(
        `INSERT INTO items (
          id, category_id, name, description, icon, icon_type, credential_hint, note, status, sort_order
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        id,
        input.categoryId ?? null,
        input.name,
        input.description ?? null,
        input.icon ?? null,
        input.iconType ?? 'emoji',
        input.credentialHint ?? null,
        input.note ?? null,
        input.status ?? 'active',
        input.sortOrder ?? 0,
      ),
    ...replaceItemChildrenStatements(db, id, input),
  ]
}

export async function updateItem(
  db: D1Database,
  id: string,
  input: ServiceItemInput,
): Promise<ServiceItem | null> {
  const statements = updateItemStatements(db, id, input)
  const [result] = await db.batch(statements)

  if (!result || result.meta.changes === 0) {
    return null
  }

  return getItem(db, id)
}

export function updateItemStatements(db: D1Database, id: string, input: ServiceItemInput): D1PreparedStatement[] {
  return [
    db
      .prepare(
        `UPDATE items
         SET category_id = ?,
             name = ?,
             description = ?,
             icon = ?,
             icon_type = ?,
             credential_hint = ?,
             note = ?,
             status = ?,
             sort_order = ?,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
      )
      .bind(
        input.categoryId ?? null,
        input.name,
        input.description ?? null,
        input.icon ?? null,
        input.iconType ?? 'emoji',
        input.credentialHint ?? null,
        input.note ?? null,
        input.status ?? 'active',
        input.sortOrder ?? 0,
        id,
      ),
    ...replaceItemChildrenStatements(db, id, input),
  ]
}

export async function deleteItem(db: D1Database, id: string): Promise<boolean> {
  const result = await deleteItemStatement(db, id).run()
  return result.meta.changes > 0
}

export function deleteItemStatement(db: D1Database, id: string): D1PreparedStatement {
  return db.prepare('DELETE FROM items WHERE id = ?').bind(id)
}

export async function getNavigation(db: D1Database): Promise<NavResponse> {
  const [categories, items] = await Promise.all([listCategories(db), listItems(db)])
  const activeItems = items.filter((item) => item.status === 'active')
  const navItems = activeItems.map(buildNavItem)

  return {
    categories: categories.map((category) => ({
      ...category,
      items: navItems.filter((item) => item.categoryId === category.id),
    })),
    uncategorized: navItems.filter((item) => item.categoryId === null),
  }
}
