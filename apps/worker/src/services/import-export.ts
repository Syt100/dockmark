import {
  dockmarkExportSchemaVersion,
  estimateJsonByteLength,
  issuesFromMessages,
  summarizeImportDocument,
  validateDockmarkExportDocument,
  validateImportLimits,
  type DockmarkExportDocument,
  type DockmarkImportMode,
  type ExportEndpoint,
  type ExportItem,
  type ImportIssue,
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

type ConflictSet = {
  categoryIds: Set<string>
  categorySlugs: Set<string>
  tagIds: Set<string>
  tagNames: Set<string>
  tagSlugs: Set<string>
  itemIds: Set<string>
  endpointIds: Set<string>
}

type ImportPlan = {
  document: DockmarkExportDocument
  importable: ImportSummary
  skipped: ImportSummary
}

type Store = {
  DB: D1Database
}

const emptySummary: ImportSummary = { categories: 0, tags: 0, items: 0, endpoints: 0 }

function placeholders(values: string[]): string {
  return values.map(() => '?').join(', ')
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
      issues: issuesFromMessages(validation.errors, 'validation'),
      errors: validation.errors,
      document: null,
    }
  }

  const summary = summarizeImportDocument(validation.value)
  const limitErrors = validateImportLimits({
    byteLength: estimateJsonByteLength(input),
    summary,
  })
  const limitIssues = issuesFromMessages(limitErrors, 'limit')
  const conflictSet =
    mode !== 'replaceAll' && limitErrors.length === 0
      ? await additiveConflictSet(db, validation.value)
      : emptyConflictSet()
  const conflictIssues = conflictIssuesForDocument(
    validation.value,
    conflictSet,
    mode === 'additiveSkipConflicts' ? 'warning' : 'error',
  )
  const plan =
    mode === 'additiveSkipConflicts' && limitIssues.length === 0
      ? planSkipConflicts(validation.value, conflictSet)
      : null
  const issues = [...limitIssues, ...conflictIssues, ...(plan?.issues ?? [])]
  const errors = issues.filter((issue) => issue.severity === 'error').map((issue) => issue.message)
  const canImport =
    mode === 'additiveSkipConflicts'
      ? limitIssues.length === 0 && plan !== null && plan.importableHasRecords
      : errors.length === 0

  return {
    ok: canImport,
    mode,
    summary,
    ...(plan
      ? {
          importable: plan.importable,
          skipped: plan.skipped,
        }
      : {}),
    ...(mode === 'replaceAll' ? { currentSummary: await getCurrentImportSummary(db) } : {}),
    issues,
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

  const document =
    mode === 'additiveSkipConflicts'
      ? planSkipConflicts(preview.document, await additiveConflictSet(store.DB, preview.document))
          .document
      : preview.document

  await store.DB.batch([
    ...(mode === 'replaceAll' ? replaceAllStatements(store.DB) : []),
    ...insertDocumentStatements(store.DB, document),
    navCacheVersionIncrementStatement(store.DB),
  ])

  return summarizeImportDocument(document)
}

async function additiveConflictSet(
  db: D1Database,
  document: DockmarkExportDocument,
): Promise<ConflictSet> {
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
    categoryIdsSet,
    categorySlugsSet,
    tagIdsSet,
    tagNamesSet,
    tagSlugsSet,
    itemIdsSet,
    endpointIdsSet,
  ] = await Promise.all([
    existingValues(db, 'SELECT id AS value FROM categories WHERE id', categoryIds),
    existingValues(db, 'SELECT slug AS value FROM categories WHERE slug', categorySlugs),
    existingValues(db, 'SELECT id AS value FROM tags WHERE id', tagIds),
    existingValues(db, 'SELECT name AS value FROM tags WHERE name', tagNames),
    existingValues(db, 'SELECT slug AS value FROM tags WHERE slug', tagSlugs),
    existingValues(db, 'SELECT id AS value FROM items WHERE id', itemIds),
    existingValues(db, 'SELECT id AS value FROM endpoints WHERE id', endpointIds),
  ])

  return {
    categoryIds: categoryIdsSet,
    categorySlugs: categorySlugsSet,
    tagIds: tagIdsSet,
    tagNames: tagNamesSet,
    tagSlugs: tagSlugsSet,
    itemIds: itemIdsSet,
    endpointIds: endpointIdsSet,
  }
}

function emptyConflictSet(): ConflictSet {
  return {
    categoryIds: new Set(),
    categorySlugs: new Set(),
    tagIds: new Set(),
    tagNames: new Set(),
    tagSlugs: new Set(),
    itemIds: new Set(),
    endpointIds: new Set(),
  }
}

function conflictIssue(
  entityType: ImportIssue['entityType'],
  entityId: string,
  field: string,
  value: string,
  label: string,
  severity: ImportIssue['severity'],
): ImportIssue {
  return {
    severity,
    kind: 'conflict',
    entityType,
    entityId,
    field,
    value,
    message: `${label} already exists: ${value}`,
  }
}

function conflictIssuesForDocument(
  document: DockmarkExportDocument,
  conflicts: ConflictSet,
  severity: ImportIssue['severity'],
): ImportIssue[] {
  const issues: ImportIssue[] = []

  for (const category of document.categories) {
    if (conflicts.categoryIds.has(category.id)) {
      issues.push(
        conflictIssue('category', category.id, 'id', category.id, 'category id', severity),
      )
    }
    if (conflicts.categorySlugs.has(category.slug)) {
      issues.push(
        conflictIssue('category', category.id, 'slug', category.slug, 'category slug', severity),
      )
    }
  }

  for (const tag of document.tags) {
    if (conflicts.tagIds.has(tag.id)) {
      issues.push(conflictIssue('tag', tag.id, 'id', tag.id, 'tag id', severity))
    }
    if (conflicts.tagNames.has(tag.name)) {
      issues.push(conflictIssue('tag', tag.id, 'name', tag.name, 'tag name', severity))
    }
    if (conflicts.tagSlugs.has(tag.slug)) {
      issues.push(conflictIssue('tag', tag.id, 'slug', tag.slug, 'tag slug', severity))
    }
  }

  for (const item of document.items) {
    if (conflicts.itemIds.has(item.id)) {
      issues.push(conflictIssue('item', item.id, 'id', item.id, 'item id', severity))
    }

    for (const endpoint of item.endpoints) {
      if (conflicts.endpointIds.has(endpoint.id)) {
        issues.push(
          conflictIssue('endpoint', endpoint.id, 'id', endpoint.id, 'endpoint id', severity),
        )
      }
    }
  }

  return issues
}

function categoryHasConflict(
  category: DockmarkExportDocument['categories'][number],
  conflicts: ConflictSet,
) {
  return conflicts.categoryIds.has(category.id) || conflicts.categorySlugs.has(category.slug)
}

function tagHasConflict(tag: DockmarkExportDocument['tags'][number], conflicts: ConflictSet) {
  return (
    conflicts.tagIds.has(tag.id) ||
    conflicts.tagNames.has(tag.name) ||
    conflicts.tagSlugs.has(tag.slug)
  )
}

function itemHasConflict(item: ExportItem, conflicts: ConflictSet) {
  return (
    conflicts.itemIds.has(item.id) ||
    item.endpoints.some((endpoint) => conflicts.endpointIds.has(endpoint.id))
  )
}

function planSkipConflicts(
  document: DockmarkExportDocument,
  conflicts: ConflictSet,
): ImportPlan & { issues: ImportIssue[]; importableHasRecords: boolean } {
  const skippedCategoryIds = new Set(
    document.categories
      .filter((category) => categoryHasConflict(category, conflicts))
      .map((category) => category.id),
  )
  const skippedTagIds = new Set(
    document.tags.filter((tag) => tagHasConflict(tag, conflicts)).map((tag) => tag.id),
  )

  const categories = document.categories.filter((category) => !skippedCategoryIds.has(category.id))
  const tags = document.tags.filter((tag) => !skippedTagIds.has(tag.id))
  const items = document.items
    .filter((item) => !itemHasConflict(item, conflicts))
    .filter((item) => !item.categoryId || !skippedCategoryIds.has(item.categoryId))
    .map((item) => ({
      ...item,
      tagIds: item.tagIds.filter((tagId) => !skippedTagIds.has(tagId)),
    }))
  const plannedDocument = {
    ...document,
    categories,
    tags,
    items,
  }
  const importable = summarizeImportDocument(plannedDocument)
  const skipped = {
    categories: document.categories.length - categories.length,
    tags: document.tags.length - tags.length,
    items: document.items.length - items.length,
    endpoints:
      summarizeImportDocument(document).endpoints -
      items.reduce((count, item) => count + item.endpoints.length, 0),
  }

  return {
    document: plannedDocument,
    importable,
    skipped,
    issues: skippedIssues(document, plannedDocument, skippedCategoryIds, skippedTagIds),
    importableHasRecords:
      importable.categories > 0 ||
      importable.tags > 0 ||
      importable.items > 0 ||
      importable.endpoints > 0,
  }
}

function skippedIssues(
  original: DockmarkExportDocument,
  planned: DockmarkExportDocument,
  skippedCategoryIds: Set<string>,
  skippedTagIds: Set<string>,
): ImportIssue[] {
  const plannedItemIds = new Set(planned.items.map((item) => item.id))
  const issues: ImportIssue[] = []

  for (const categoryId of skippedCategoryIds) {
    issues.push({
      severity: 'warning',
      kind: 'skip',
      entityType: 'category',
      entityId: categoryId,
      message: `category will be skipped: ${categoryId}`,
    })
  }

  for (const tagId of skippedTagIds) {
    issues.push({
      severity: 'warning',
      kind: 'skip',
      entityType: 'tag',
      entityId: tagId,
      message: `tag will be skipped: ${tagId}`,
    })
  }

  for (const item of original.items) {
    if (!plannedItemIds.has(item.id)) {
      issues.push({
        severity: 'warning',
        kind: 'skip',
        entityType: 'item',
        entityId: item.id,
        message: `service will be skipped: ${item.id}`,
      })
    }
  }

  return issues
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
