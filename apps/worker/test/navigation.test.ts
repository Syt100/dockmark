import { describe, expect, it } from 'vitest'

import app from '../src/index'
import { createMockEnv } from './mock-env'

async function json(response: Response): Promise<unknown> {
  return response.json()
}

describe('navigation API', () => {
  it('creates categories, tags, items, and navigation payloads', async () => {
    const env = createMockEnv()

    const categoryResponse = await app.request(
      '/api/categories',
      {
        method: 'POST',
        body: JSON.stringify({ name: 'Media', icon: 'play' }),
        headers: { 'content-type': 'application/json' },
      },
      env,
    )
    expect(categoryResponse.status).toBe(201)
    const categoryBody = await json(categoryResponse) as { category: { id: string } }

    const tagResponse = await app.request(
      '/api/tags',
      {
        method: 'POST',
        body: JSON.stringify({ name: 'photos' }),
        headers: { 'content-type': 'application/json' },
      },
      env,
    )
    expect(tagResponse.status).toBe(201)
    const tagBody = await json(tagResponse) as { tag: { id: string } }

    const itemResponse = await app.request(
      '/api/items',
      {
        method: 'POST',
        body: JSON.stringify({
          name: 'Immich',
          categoryId: categoryBody.category.id,
          credentialHint: 'Vaultwarden search Immich',
          endpoints: [
            {
              label: 'Public',
              url: 'https://photos.example.com',
              kind: 'public',
              isPrimary: true,
            },
            {
              label: 'LAN',
              url: 'http://192.168.1.20:2283',
              kind: 'lan',
            },
          ],
          tagIds: [tagBody.tag.id],
        }),
        headers: { 'content-type': 'application/json' },
      },
      env,
    )
    expect(itemResponse.status).toBe(201)

    const navResponse = await app.request('/api/nav', {}, env)
    expect(navResponse.headers.get('X-Dockmark-Cache')).toBe('miss')

    const nav = await json(navResponse) as {
      categories: Array<{ name: string; items: Array<{ name: string; primaryEndpoint: { url: string } }> }>
    }

    expect(nav.categories[0]?.name).toBe('Media')
    expect(nav.categories[0]?.items[0]?.name).toBe('Immich')
    expect(nav.categories[0]?.items[0]?.primaryEndpoint.url).toBe('https://photos.example.com')

    const cachedResponse = await app.request('/api/nav', {}, env)
    expect(cachedResponse.headers.get('X-Dockmark-Cache')).toBe('hit')
  })

  it('rejects items without exactly one primary endpoint', async () => {
    const response = await app.request(
      '/api/items',
      {
        method: 'POST',
        body: JSON.stringify({
          name: 'Broken',
          endpoints: [
            {
              label: 'Public',
              url: 'https://broken.example.com',
              kind: 'public',
            },
          ],
        }),
        headers: { 'content-type': 'application/json' },
      },
      createMockEnv(),
    )

    expect(response.status).toBe(400)
    await expect(response.text()).resolves.toContain('exactly one endpoint must be primary')
  })

  it('invalidates navigation cache after writes', async () => {
    const env = createMockEnv()

    await app.request('/api/nav', {}, env)
    const cached = await app.request('/api/nav', {}, env)
    expect(cached.headers.get('X-Dockmark-Cache')).toBe('hit')

    await app.request(
      '/api/categories',
      {
        method: 'POST',
        body: JSON.stringify({ name: 'Infra' }),
        headers: { 'content-type': 'application/json' },
      },
      env,
    )

    const refreshed = await app.request('/api/nav', {}, env)
    expect(refreshed.headers.get('X-Dockmark-Cache')).toBe('miss')
  })

  it('updates tags and invalidates navigation cache', async () => {
    const env = createMockEnv()

    const tagResponse = await app.request(
      '/api/tags',
      {
        method: 'POST',
        body: JSON.stringify({ name: 'media' }),
        headers: { 'content-type': 'application/json' },
      },
      env,
    )
    const tagBody = await json(tagResponse) as { tag: { id: string } }

    await app.request('/api/nav', {}, env)
    const cached = await app.request('/api/nav', {}, env)
    expect(cached.headers.get('X-Dockmark-Cache')).toBe('hit')

    const updateResponse = await app.request(
      `/api/tags/${tagBody.tag.id}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ name: '媒体', slug: 'media-cn' }),
        headers: { 'content-type': 'application/json' },
      },
      env,
    )

    expect(updateResponse.status).toBe(200)
    const updateBody = await json(updateResponse) as { tag: { name: string; slug: string } }
    expect(updateBody.tag.name).toBe('媒体')
    expect(updateBody.tag.slug).toBe('media-cn')

    const refreshed = await app.request('/api/nav', {}, env)
    expect(refreshed.headers.get('X-Dockmark-Cache')).toBe('miss')
  })

  it('returns not found when updating a missing tag', async () => {
    const response = await app.request(
      '/api/tags/tag_missing',
      {
        method: 'PATCH',
        body: JSON.stringify({ name: 'missing' }),
        headers: { 'content-type': 'application/json' },
      },
      createMockEnv(),
    )

    expect(response.status).toBe(404)
  })
})
