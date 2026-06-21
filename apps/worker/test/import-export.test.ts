import { describe, expect, it } from 'vitest'

import {
  dockmarkExportFormat,
  dockmarkExportSchemaVersion,
  dockmarkExportSource,
  importLimits,
  type DockmarkExportDocument,
} from '@dockmark/shared'

import app from '../src/index'
import { createMockEnv } from './mock-env'

const timestamp = '2026-06-21T00:00:00.000Z'
const headers = { 'content-type': 'application/json' }

async function json(response: Response): Promise<unknown> {
  return response.json()
}

function document(overrides: Partial<DockmarkExportDocument> = {}): DockmarkExportDocument {
  return {
    format: dockmarkExportFormat,
    source: dockmarkExportSource,
    appVersion: '0.1.0-test',
    schemaVersion: dockmarkExportSchemaVersion,
    generatedAt: timestamp,
    categories: [
      {
        id: 'cat_media',
        name: 'Media',
        slug: 'media',
        icon: null,
        color: null,
        sortOrder: 0,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    ],
    tags: [
      {
        id: 'tag_photo',
        name: 'Photo',
        slug: 'photo',
        createdAt: timestamp,
      },
    ],
    items: [
      {
        id: 'item_immich',
        categoryId: 'cat_media',
        name: 'Immich',
        description: null,
        icon: null,
        iconType: 'favicon',
        credentialHint: 'Vaultwarden search Immich',
        note: null,
        status: 'active',
        sortOrder: 0,
        createdAt: timestamp,
        updatedAt: timestamp,
        endpoints: [
          {
            id: 'end_immich',
            label: 'Public',
            url: 'https://photos.example.com',
            kind: 'public',
            isPrimary: true,
            sortOrder: 0,
            createdAt: timestamp,
            updatedAt: timestamp,
          },
        ],
        tagIds: ['tag_photo'],
      },
    ],
    ...overrides,
  }
}

async function importRequest(
  env: ReturnType<typeof createMockEnv>,
  mode: 'additive' | 'additiveSkipConflicts' | 'replaceAll',
  body: DockmarkExportDocument = document(),
): Promise<Response> {
  return app.request(
    '/api/import-export/import',
    {
      method: 'POST',
      headers,
      body: JSON.stringify({ mode, document: body }),
    },
    env,
  )
}

describe('import/export API', () => {
  it('exports service navigation data without auth records', async () => {
    const env = createMockEnv()

    const imported = await importRequest(env, 'additive')
    expect(imported.status).toBe(200)

    const response = await app.request('/api/import-export/export', {}, env)
    expect(response.status).toBe(200)
    expect(response.headers.get('content-disposition')).toContain('dockmark-export-')

    const body = (await json(response)) as DockmarkExportDocument & {
      authUsers?: unknown
      sessions?: unknown
    }
    expect(body.schemaVersion).toBe(1)
    expect(body).toMatchObject({
      format: dockmarkExportFormat,
      source: dockmarkExportSource,
      appVersion: '0.1.0-test',
    })
    expect(body.categories[0]).toMatchObject({ id: 'cat_media', slug: 'media' })
    expect(body.items[0]).toMatchObject({
      id: 'item_immich',
      endpoints: [{ id: 'end_immich' }],
      tagIds: ['tag_photo'],
    })
    expect(body.authUsers).toBeUndefined()
    expect(body.sessions).toBeUndefined()
  })

  it('previews imports without writing D1 records', async () => {
    const env = createMockEnv()

    const response = await app.request(
      '/api/import-export/preview',
      {
        method: 'POST',
        headers,
        body: JSON.stringify({ mode: 'additive', document: document() }),
      },
      env,
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      ok: true,
      mode: 'additive',
      summary: { categories: 1, tags: 1, items: 1, endpoints: 1 },
      details: {
        importable: {
          categories: [{ id: 'cat_media', name: 'Media' }],
          tags: [{ id: 'tag_photo', name: 'Photo' }],
          items: [{ id: 'item_immich', name: 'Immich' }],
        },
        skipped: { categories: [], tags: [], items: [] },
      },
      issues: [],
      errors: [],
    })
    expect(env.__testStore.categories).toHaveLength(0)
    expect(env.__testStore.items).toHaveLength(0)
  })

  it('rejects additive imports when records conflict', async () => {
    const env = createMockEnv()
    expect((await importRequest(env, 'additive')).status).toBe(200)

    const response = await app.request(
      '/api/import-export/preview',
      {
        method: 'POST',
        headers,
        body: JSON.stringify({ mode: 'additive', document: document() }),
      },
      env,
    )

    expect(response.status).toBe(200)
    const body = (await json(response)) as { ok: boolean; errors: string[] }
    expect(body.ok).toBe(false)
    expect(body.errors).toEqual(
      expect.arrayContaining([
        '分类 ID 已存在：Media (cat_media)',
        '分类 slug 已存在：Media (media)',
        '标签 ID 已存在：Photo (tag_photo)',
        '标签名称 已存在：Photo (Photo)',
        '标签 slug 已存在：Photo (photo)',
        '服务 ID 已存在：Immich (item_immich)',
        '地址 ID 已存在：Public (end_immich)',
      ]),
    )

    const importAgain = await importRequest(env, 'additive')
    expect(importAgain.status).toBe(400)
    expect(env.__testStore.categories).toHaveLength(1)
  })

  it('groups additive conflicts as structured issues', async () => {
    const env = createMockEnv()
    expect((await importRequest(env, 'additive')).status).toBe(200)

    const response = await app.request(
      '/api/import-export/preview',
      {
        method: 'POST',
        headers,
        body: JSON.stringify({ mode: 'additive', document: document() }),
      },
      env,
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      issues: expect.arrayContaining([
        {
          severity: 'error',
          kind: 'conflict',
          entityType: 'category',
          entityId: 'cat_media',
          entityName: 'Media',
          field: 'id',
          value: 'cat_media',
          message: '分类 ID 已存在：Media (cat_media)',
        },
        {
          severity: 'error',
          kind: 'conflict',
          entityType: 'item',
          entityId: 'item_immich',
          entityName: 'Immich',
          field: 'id',
          value: 'item_immich',
          message: '服务 ID 已存在：Immich (item_immich)',
        },
      ]),
    })
  })

  it('warns when import text resembles stored secrets', async () => {
    const env = createMockEnv()
    const response = await app.request(
      '/api/import-export/preview',
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          mode: 'additive',
          document: document({
            items: [
              {
                ...document().items[0],
                credentialHint: 'password=correct-horse-battery-staple',
              },
            ],
          }),
        }),
      },
      env,
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      issues: [
        {
          severity: 'warning',
          kind: 'secret',
          entityType: 'item',
          entityId: 'item_immich',
          entityName: 'Immich',
          field: 'credentialHint',
          message: '服务 Immich 的凭据提示可能包含敏感内容',
        },
      ],
      errors: [],
    })
  })

  it('imports safe records in additive skip-conflicts mode', async () => {
    const env = createMockEnv()
    expect((await importRequest(env, 'additive')).status).toBe(200)

    const mixed = document({
      categories: [
        ...document().categories,
        {
          id: 'cat_books',
          name: 'Books',
          slug: 'books',
          icon: null,
          color: null,
          sortOrder: 1,
          createdAt: timestamp,
          updatedAt: timestamp,
        },
      ],
      tags: [
        ...document().tags,
        {
          id: 'tag_reading',
          name: 'Reading',
          slug: 'reading',
          createdAt: timestamp,
        },
      ],
      items: [
        ...document().items,
        {
          id: 'item_calibre',
          categoryId: 'cat_books',
          name: 'Calibre',
          description: null,
          icon: null,
          iconType: 'favicon',
          credentialHint: null,
          note: null,
          status: 'active',
          sortOrder: 1,
          createdAt: timestamp,
          updatedAt: timestamp,
          endpoints: [
            {
              id: 'end_calibre',
              label: 'Public',
              url: 'https://books.example.com',
              kind: 'public',
              isPrimary: true,
              sortOrder: 0,
              createdAt: timestamp,
              updatedAt: timestamp,
            },
          ],
          tagIds: ['tag_photo', 'tag_reading'],
        },
      ],
    })

    const preview = await app.request(
      '/api/import-export/preview',
      {
        method: 'POST',
        headers,
        body: JSON.stringify({ mode: 'additiveSkipConflicts', document: mixed }),
      },
      env,
    )

    expect(preview.status).toBe(200)
    await expect(preview.json()).resolves.toMatchObject({
      ok: true,
      mode: 'additiveSkipConflicts',
      importable: { categories: 1, tags: 1, items: 1, endpoints: 1 },
      skipped: { categories: 1, tags: 1, items: 1, endpoints: 1 },
      details: {
        importable: {
          categories: [{ id: 'cat_books', name: 'Books' }],
          tags: [{ id: 'tag_reading', name: 'Reading' }],
          items: [{ id: 'item_calibre', name: 'Calibre' }],
        },
        skipped: {
          categories: [{ id: 'cat_media', name: 'Media', reason: '冲突或依赖冲突' }],
          tags: [{ id: 'tag_photo', name: 'Photo', reason: '冲突' }],
          items: [{ id: 'item_immich', name: 'Immich', reason: '冲突或依赖冲突' }],
        },
      },
      issues: expect.arrayContaining([
        expect.objectContaining({
          severity: 'warning',
          kind: 'conflict',
          entityType: 'category',
        }),
        expect.objectContaining({
          severity: 'warning',
          kind: 'skip',
          entityType: 'item',
          entityId: 'item_immich',
        }),
      ]),
    })

    const imported = await importRequest(env, 'additiveSkipConflicts', mixed)
    expect(imported.status).toBe(200)
    await expect(imported.json()).resolves.toMatchObject({
      imported: { categories: 1, tags: 1, items: 1, endpoints: 1 },
      details: {
        importable: {
          items: [{ id: 'item_calibre', name: 'Calibre' }],
        },
      },
    })

    const items = await app.request('/api/items', {}, env)
    const itemsBody = (await items.json()) as {
      items: Array<{
        id: string
        tags: Array<{ id: string; name: string; slug: string; createdAt: string }>
      }>
    }
    const importedItem = itemsBody.items.find((item) => item.id === 'item_calibre')
    expect(importedItem?.tags).toEqual([
      { id: 'tag_reading', name: 'Reading', slug: 'reading', createdAt: timestamp },
    ])
  })

  it('replace-all restores a full document and removes previous records', async () => {
    const env = createMockEnv()

    await app.request(
      '/api/categories',
      {
        method: 'POST',
        headers,
        body: JSON.stringify({ name: 'Old' }),
      },
      env,
    )

    const response = await importRequest(env, 'replaceAll')
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      imported: { categories: 1, tags: 1, items: 1, endpoints: 1 },
      details: {
        importable: {
          items: [{ id: 'item_immich', name: 'Immich' }],
        },
      },
    })

    const categories = await app.request('/api/categories', {}, env)
    await expect(categories.json()).resolves.toMatchObject({
      categories: [{ id: 'cat_media', name: 'Media' }],
    })
    expect(env.__testStore.categories.some((category) => category.name === 'Old')).toBe(false)
  })

  it('rolls back replace-all when cache invalidation fails', async () => {
    const env = createMockEnv()

    await app.request(
      '/api/categories',
      {
        method: 'POST',
        headers,
        body: JSON.stringify({ name: 'Old' }),
      },
      env,
    )

    env.__testStore.failNextNavCacheVersionIncrement = true
    const response = await importRequest(env, 'replaceAll')

    expect(response.status).toBe(400)
    expect(env.__testStore.categories.map((category) => category.name)).toEqual(['Old'])
    expect(env.__testStore.items).toHaveLength(0)
  })

  it('invalidates navigation cache after successful imports', async () => {
    const env = createMockEnv()

    await app.request('/api/nav', {}, env)
    const cached = await app.request('/api/nav', {}, env)
    expect(cached.headers.get('X-Dockmark-Cache')).toBe('hit')

    const response = await importRequest(env, 'additive')
    expect(response.status).toBe(200)

    const refreshed = await app.request('/api/nav', {}, env)
    expect(refreshed.headers.get('X-Dockmark-Cache')).toBe('miss')
  })

  it('rejects imports that exceed record limits without writing data', async () => {
    const env = createMockEnv()
    const oversized = document({
      categories: Array.from({ length: importLimits.maxCategories + 1 }, (_, index) => ({
        id: `cat_${index}`,
        name: `Category ${index}`,
        slug: `category-${index}`,
        icon: null,
        color: null,
        sortOrder: index,
        createdAt: timestamp,
        updatedAt: timestamp,
      })),
      items: [],
    })

    const response = await app.request(
      '/api/import-export/preview',
      {
        method: 'POST',
        headers,
        body: JSON.stringify({ mode: 'additive', document: oversized }),
      },
      env,
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      errors: [`categories must be at most ${importLimits.maxCategories}`],
    })

    const imported = await importRequest(env, 'additive', oversized)
    expect(imported.status).toBe(400)
    expect(env.__testStore.categories).toHaveLength(0)
  })
})
