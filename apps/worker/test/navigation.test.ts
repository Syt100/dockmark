import { describe, expect, it } from 'vitest'

import app from '../src/index'
import { createMockEnv } from './mock-env'

async function json(response: Response): Promise<unknown> {
  return response.json()
}

async function createBuiltinSessionCookie(): Promise<{ env: ReturnType<typeof createMockEnv>; cookie: string }> {
  const env = createMockEnv({ AUTH_MODE: 'builtin', SETUP_TOKEN: 'setup-secret' })
  const response = await app.request('/api/auth/setup', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      setupToken: 'setup-secret',
      email: 'owner@example.com',
      password: 'correct horse battery staple',
    }),
  }, env)
  const cookie = response.headers.get('set-cookie')?.split(';')[0]

  if (!cookie) {
    throw new Error('Expected setup to issue a session cookie')
  }

  return { env, cookie }
}

describe('navigation API', () => {
  it('requires authentication for data read APIs outside health checks', async () => {
    const env = createMockEnv({ AUTH_MODE: 'builtin' })

    for (const path of ['/api/nav', '/api/categories', '/api/tags', '/api/items', '/api/items/item_missing']) {
      const response = await app.request(path, {}, env)
      expect(response.status).toBe(401)
      await expect(response.text()).resolves.toContain('Authentication required')
    }
  })

  it('allows data read APIs when the auth adapter accepts the request', async () => {
    const { env, cookie } = await createBuiltinSessionCookie()

    for (const path of ['/api/nav', '/api/categories', '/api/tags', '/api/items']) {
      const response = await app.request(path, { headers: { cookie } }, env)
      expect(response.status).toBe(200)
    }
  })

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
