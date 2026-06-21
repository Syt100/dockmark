import {
  dockmarkExportSchemaVersion,
  estimateJsonByteLength,
  summarizeImportDocument,
  validateDockmarkExportDocument,
  validateImportLimits,
  type DockmarkExportDocument,
  type DockmarkImportMode,
  type ExportEndpoint,
  type ExportItem,
  type ImportPreviewResponse,
  type ImportSummary,
} from '@dockmark/shared'

import { listCategories } from '../db/categories'
import { listItems } from '../db/items'
import { listTags } from '../db/tags'
import { navCacheVersionIncrementStatement } from '../lib/cache'

type ConflictRow = {
  value: string
}

type Store = {
  DB: D1Database
}

const emptySummary: ImportSummary = { categories: 0, tags: 0, items: 0, endpoints: 0 }

function placeholders(values: string[]): string {
  return values.map(() => '?').join(', ')
}

function conflictErrors(label: string, values: string[], existing: Set<string>): string[] {
  return values
    .filter((value) => existing.has(value))
    .map((value) => `${label} already exists: ${value}`)
}

async function existingValues(
  db: D1Database,
  sqlPrefix: string,
  values: string[],
): Promise<Set<string>> {
  if (values.length === 0) {
    return new Set()
  }

  const result = await db
    .prepare(`${sqlPrefix} IN (${placeholders(values)})`)
    .bind(...values)
    .all<ConflictRow>()

  return new Set(result.results.map((row) => row.value))
}

export async function buildExportDocument(db: D1Database): Promise<DockmarkExportDocument> {
  const [categories, tags, items] = await Promise.all([
    listCategories(db),
    listTags(db),
    listItems(db),
  ])

  return {
    schemaVersion: dockmarkExportSchemaVersion,
    generatedAt: new Date().toISOString(),
    categories,
    tags,
    items: items.map((item) => ({
      id: item.id,
      categoryId: item.categoryId,
      name: item.name,
      description: item.description,
      icon: item.icon,
      iconType: item.iconType,
      credentialHint: item.credentialHint,
      note: item.note,
      status: item.status,
      sortOrder: item.sortOrder,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      endpoints: item.endpoints.map((endpoint) => ({
        id: endpoint.id,
        label: endpoint.label,
        url: endpoint.url,
        kind: endpoint.kind,
        isPrimary: endpoint.isPrimary,
        sortOrder: endpoint.sortOrder,
        createdAt: endpoint.createdAt,
        updatedAt: endpoint.updatedAt,
      })),
      tagIds: item.tags.map((tag) => tag.id),
    })),
  }
}

export async function getCurrentImportSummary(db: D1Database): Promise<ImportSummary> {
  return summarizeImportDocument(await buildExportDocument(db))
}

export async function previewImport(
  db: D1Database,
  mode: DockmarkImportMode,
  input: unknown,
): Promise<ImportPreviewResponse & { document: DockmarkExportDocument | null }> {
  const validation = validateDockmarkExportDocument(input)

  if (!validation.ok) {
    return {
      ok: false,
      mode,
      summary: emptySummary,
      ...(mode === 'replaceAll' ? { currentSummary: await getCurrentImportSummary(db) } : {}),
      errors: validation.errors,
      document: null,
    }
  }

  const summary = summarizeImportDocument(validation.value)
  const limitErrors = validateImportLimits({
    byteLength: estimateJsonByteLength(input),
    summary,
  })
  const conflictErrors =
    mode === 'additive' && limitErrors.length === 0
      ? await additiveConflictErrors(db, validation.value)
      : []
  const errors = [...limitErrors, ...conflictErrors]

  return {
    ok: errors.length === 0,
    mode,
    summary,
    ...(mode === 'replaceAll' ? { currentSummary: await getCurrentImportSummary(db) } : {}),
    errors,
    document: validation.value,
  }
}

export async function importDocument(
  store: Store,
  mode: DockmarkImportMode,
  input: unknown,
): Promise<ImportSummary> {
  const preview = await previewImport(store.DB, mode, input)

  if (!preview.ok || !preview.document) {
    throw new Error(preview.errors.join('; ') || 'Import document is invalid')
  }

  await store.DB.batch([
    ...(mode === 'replaceAll' ? replaceAllStatements(store.DB) : []),
    ...insertDocumentStatements(store.DB, preview.document),
    navCacheVersionIncrementStatement(store.DB),
  ])

  return preview.summary
}

async function additiveConflictErrors(
  db: D1Database,
  document: DockmarkExportDocument,
): Promise<string[]> {
  const categoryIds = document.categories.map((category) => category.id)
  const categorySlugs = document.categories.map((category) => category.slug)
  const tagIds = document.tags.map((tag) => tag.id)
  const tagNames = document.tags.map((tag) => tag.name)
  const tagSlugs = document.tags.map((tag) => tag.slug)
  const itemIds = document.items.map((item) => item.id)
  const endpointIds = document.items.flatMap((item) =>
    item.endpoints.map((endpoint) => endpoint.id),
  )

  const [
    existingCategoryIds,
    existingCategorySlugs,
    existingTagIds,
    existingTagNames,
    existingTagSlugs,
    existingItemIds,
    existingEndpointIds,
  ] = await Promise.all([
    existingValues(db, 'SELECT id AS value FROM categories WHERE id', categoryIds),
    existingValues(db, 'SELECT slug AS value FROM categories WHERE slug', categorySlugs),
    existingValues(db, 'SELECT id AS value FROM tags WHERE id', tagIds),
    existingValues(db, 'SELECT name AS value FROM tags WHERE name', tagNames),
    existingValues(db, 'SELECT slug AS value FROM tags WHERE slug', tagSlugs),
    existingValues(db, 'SELECT id AS value FROM items WHERE id', itemIds),
    existingValues(db, 'SELECT id AS value FROM endpoints WHERE id', endpointIds),
  ])

  return [
    ...conflictErrors('category id', categoryIds, existingCategoryIds),
    ...conflictErrors('category slug', categorySlugs, existingCategorySlugs),
    ...conflictErrors('tag id', tagIds, existingTagIds),
    ...conflictErrors('tag name', tagNames, existingTagNames),
    ...conflictErrors('tag slug', tagSlugs, existingTagSlugs),
    ...conflictErrors('item id', itemIds, existingItemIds),
    ...conflictErrors('endpoint id', endpointIds, existingEndpointIds),
  ]
}

function replaceAllStatements(db: D1Database): D1PreparedStatement[] {
  return [
    db.prepare('DELETE FROM item_tags'),
    db.prepare('DELETE FROM endpoints'),
    db.prepare('DELETE FROM items'),
    db.prepare('DELETE FROM tags'),
    db.prepare('DELETE FROM categories'),
  ]
}

function insertDocumentStatements(
  db: D1Database,
  document: DockmarkExportDocument,
): D1PreparedStatement[] {
  return [
    ...document.categories.map((category) =>
      db
        .prepare(
          `INSERT INTO categories (
            id, name, slug, icon, color, sort_order, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          category.id,
          category.name,
          category.slug,
          category.icon,
          category.color,
          category.sortOrder,
          category.createdAt,
          category.updatedAt,
        ),
    ),
    ...document.tags.map((tag) =>
      db
        .prepare('INSERT INTO tags (id, name, slug, created_at) VALUES (?, ?, ?, ?)')
        .bind(tag.id, tag.name, tag.slug, tag.createdAt),
    ),
    ...document.items.flatMap((item) => [
      insertItemStatement(db, item),
      ...item.endpoints.map((endpoint) => insertEndpointStatement(db, item.id, endpoint)),
      ...item.tagIds.map((tagId) =>
        db.prepare('INSERT INTO item_tags (item_id, tag_id) VALUES (?, ?)').bind(item.id, tagId),
      ),
    ]),
  ]
}

function insertItemStatement(db: D1Database, item: ExportItem): D1PreparedStatement {
  return db
    .prepare(
      `INSERT INTO items (
        id,
        category_id,
        name,
        description,
        icon,
        icon_type,
        credential_hint,
        note,
        status,
        sort_order,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      item.id,
      item.categoryId,
      item.name,
      item.description,
      item.icon,
      item.iconType,
      item.credentialHint,
      item.note,
      item.status,
      item.sortOrder,
      item.createdAt,
      item.updatedAt,
    )
}

function insertEndpointStatement(
  db: D1Database,
  itemId: string,
  endpoint: ExportEndpoint,
): D1PreparedStatement {
  return db
    .prepare(
      `INSERT INTO endpoints (
        id, item_id, label, url, kind, is_primary, sort_order, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      endpoint.id,
      itemId,
      endpoint.label,
      endpoint.url,
      endpoint.kind,
      endpoint.isPrimary ? 1 : 0,
      endpoint.sortOrder,
      endpoint.createdAt,
      endpoint.updatedAt,
    )
}
