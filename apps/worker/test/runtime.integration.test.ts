import { env, SELF, applyD1Migrations } from 'cloudflare:test'
import { beforeEach, describe, expect, inject, it } from 'vitest'
import type { D1Migration } from '@cloudflare/vitest-pool-workers'

const migrations = inject('migrations') as D1Migration[]

const setupBody = {
  setupToken: 'setup-secret',
  email: 'owner@example.com',
  password: 'correct horse battery staple',
}

async function resetDb() {
  await applyD1Migrations(env.DB, migrations)
  await env.DB.batch([
    env.DB.prepare('DELETE FROM item_tags'),
    env.DB.prepare('DELETE FROM endpoints'),
    env.DB.prepare('DELETE FROM items'),
    env.DB.prepare('DELETE FROM tags'),
    env.DB.prepare('DELETE FROM categories'),
    env.DB.prepare('DELETE FROM auth_sessions'),
    env.DB.prepare('DELETE FROM auth_users'),
    env.DB.prepare("DELETE FROM app_metadata WHERE key <> 'schema_version'"),
  ])
}

async function setupSession(): Promise<string> {
  const response = await SELF.fetch('https://dockmark.test/api/auth/setup', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(setupBody),
  })
  const cookie = response.headers.get('set-cookie')?.split(';')[0]

  if (!cookie) {
    throw new Error('Expected setup to issue a session cookie')
  }

  return cookie
}

async function json(response: Response): Promise<unknown> {
  return response.json()
}

describe('runtime-backed Worker integration', () => {
  beforeEach(async () => {
    await resetDb()
  })

  it('applies D1 migrations and exercises built-in auth lifecycle', async () => {
    const setup = await SELF.fetch('https://dockmark.test/api/auth/setup')
    await expect(setup.json()).resolves.toMatchObject({
      authMode: 'builtin',
      needsSetup: true,
    })

    const cookie = await setupSession()

    const me = await SELF.fetch('https://dockmark.test/api/auth/me', {
      headers: { cookie },
    })
    expect(me.status).toBe(200)
    await expect(me.json()).resolves.toMatchObject({ user: { email: 'owner@example.com' } })

    const logout = await SELF.fetch('https://dockmark.test/api/auth/logout', {
      method: 'POST',
      headers: { cookie },
    })
    expect(logout.status).toBe(204)

    const rejected = await SELF.fetch('https://dockmark.test/api/nav', {
      headers: { cookie },
    })
    expect(rejected.status).toBe(401)
    await expect(rejected.json()).resolves.toMatchObject({
      error: { code: 'authentication_required' },
    })
  })

  it('exercises service navigation D1 writes and KV cache invalidation', async () => {
    const cookie = await setupSession()
    const headers = { cookie, 'content-type': 'application/json' }

    const categoryResponse = await SELF.fetch('https://dockmark.test/api/categories', {
      method: 'POST',
      headers,
      body: JSON.stringify({ name: 'Media' }),
    })
    expect(categoryResponse.status).toBe(201)
    const categoryBody = await json(categoryResponse) as { category: { id: string } }

    const tagResponse = await SELF.fetch('https://dockmark.test/api/tags', {
      method: 'POST',
      headers,
      body: JSON.stringify({ name: 'photos' }),
    })
    expect(tagResponse.status).toBe(201)
    const tagBody = await json(tagResponse) as { tag: { id: string } }

    const itemResponse = await SELF.fetch('https://dockmark.test/api/items', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: 'Immich',
        categoryId: categoryBody.category.id,
        endpoints: [{
          label: 'Public',
          url: 'https://photos.example.com',
          kind: 'public',
          isPrimary: true,
        }],
        tagIds: [tagBody.tag.id],
      }),
    })
    expect(itemResponse.status).toBe(201)

    const nav = await SELF.fetch('https://dockmark.test/api/nav', { headers: { cookie } })
    expect(nav.headers.get('X-Dockmark-Cache')).toBe('miss')

    const cached = await SELF.fetch('https://dockmark.test/api/nav', { headers: { cookie } })
    expect(cached.headers.get('X-Dockmark-Cache')).toBe('hit')

    const missingUpdate = await SELF.fetch('https://dockmark.test/api/tags/tag_missing', {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ name: 'missing' }),
    })
    expect(missingUpdate.status).toBe(404)

    const stillCached = await SELF.fetch('https://dockmark.test/api/nav', { headers: { cookie } })
    expect(stillCached.headers.get('X-Dockmark-Cache')).toBe('hit')

    const updated = await SELF.fetch(`https://dockmark.test/api/tags/${tagBody.tag.id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ name: 'photos-updated' }),
    })
    expect(updated.status).toBe(200)

    const refreshed = await SELF.fetch('https://dockmark.test/api/nav', { headers: { cookie } })
    expect(refreshed.headers.get('X-Dockmark-Cache')).toBe('miss')
  })

  it('uses D1 constraints and structured errors for invalid writes', async () => {
    const cookie = await setupSession()
    const headers = { cookie, 'content-type': 'application/json' }

    const first = await SELF.fetch('https://dockmark.test/api/tags', {
      method: 'POST',
      headers,
      body: JSON.stringify({ name: 'media' }),
    })
    expect(first.status).toBe(201)

    const duplicate = await SELF.fetch('https://dockmark.test/api/tags', {
      method: 'POST',
      headers,
      body: JSON.stringify({ name: 'media' }),
    })
    expect(duplicate.status).toBe(409)
    const duplicateBody = await duplicate.json() as { error: { code: string; message: string } }
    expect(duplicateBody).toMatchObject({
      error: { code: 'conflict', message: 'Resource already exists' },
    })
    expect(duplicateBody.error.message).not.toContain('UNIQUE constraint failed')
    expect(duplicateBody.error.message).not.toContain('tags.name')

    const invalid = await SELF.fetch('https://dockmark.test/api/items', {
      method: 'POST',
      headers,
      body: JSON.stringify({ name: 'Broken', endpoints: [] }),
    })
    expect(invalid.status).toBe(400)
    await expect(invalid.json()).resolves.toMatchObject({
      error: {
        code: 'validation_failed',
        message: expect.stringContaining('at least one endpoint is required'),
      },
    })
  })
})
