import { describe, expect, it } from 'vitest'

import { dockmarkExportSchemaVersion, type DockmarkExportDocument } from '@dockmark/shared'

import app from '../src/index'
import { createMockEnv } from './mock-env'

const timestamp = '2026-06-21T00:00:00.000Z'
const headers = { 'content-type': 'application/json' }

async function json(response: Response): Promise<unknown> {
  return response.json()
}

function document(overrides: Partial<DockmarkExportDocument> = {}): DockmarkExportDocument {
  return {
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
  mode: 'additive' | 'replaceAll',
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
        'category id already exists: cat_media',
        'category slug already exists: media',
        'tag id already exists: tag_photo',
        'tag name already exists: Photo',
        'tag slug already exists: photo',
        'item id already exists: item_immich',
        'endpoint id already exists: end_immich',
      ]),
    )

    const importAgain = await importRequest(env, 'additive')
    expect(importAgain.status).toBe(400)
    expect(env.__testStore.categories).toHaveLength(1)
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
    await expect(response.json()).resolves.toEqual({
      imported: { categories: 1, tags: 1, items: 1, endpoints: 1 },
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
})
