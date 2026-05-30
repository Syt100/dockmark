import { describe, expect, it } from 'vitest'

import app from '../src/index'
import { createMockEnv } from './mock-env'

const setupBody = {
  setupToken: 'setup-secret',
  email: 'Owner@Example.com',
  password: 'correct horse battery staple',
  name: 'Owner',
}

function cookieFrom(response: Response): string {
  const cookie = response.headers.get('set-cookie')
  expect(cookie).toContain('dockmark_session=')
  return cookie?.split(';')[0] ?? ''
}

describe('built-in auth API', () => {
  it('reports setup status before and after administrator setup', async () => {
    const env = createMockEnv({ AUTH_MODE: 'builtin', SETUP_TOKEN: 'setup-secret' })

    const before = await app.request('/api/auth/setup', {}, env)
    await expect(before.json()).resolves.toMatchObject({
      authMode: 'builtin',
      needsSetup: true,
      supported: true,
    })

    const created = await app.request('/api/auth/setup', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(setupBody),
    }, env)
    expect(created.status).toBe(201)
    expect(created.headers.get('set-cookie')).toContain('HttpOnly')
    await expect(created.json()).resolves.toMatchObject({
      user: {
        email: 'owner@example.com',
        name: 'Owner',
        mode: 'builtin',
      },
    })

    const after = await app.request('/api/auth/setup', {}, env)
    await expect(after.json()).resolves.toMatchObject({
      needsSetup: false,
    })
  })

  it('rejects invalid setup tokens and additional setup attempts', async () => {
    const env = createMockEnv({ AUTH_MODE: 'builtin', SETUP_TOKEN: 'setup-secret' })

    const invalid = await app.request('/api/auth/setup', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ...setupBody, setupToken: 'wrong' }),
    }, env)
    expect(invalid.status).toBe(401)

    const created = await app.request('/api/auth/setup', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(setupBody),
    }, env)
    expect(created.status).toBe(201)

    const repeated = await app.request('/api/auth/setup', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(setupBody),
    }, env)
    expect(repeated.status).toBe(409)
  })

  it('logs in, authenticates protected APIs, and logs out', async () => {
    const env = createMockEnv({ AUTH_MODE: 'builtin', SETUP_TOKEN: 'setup-secret' })
    const created = await app.request('/api/auth/setup', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(setupBody),
    }, env)
    const firstCookie = cookieFrom(created)

    const me = await app.request('/api/auth/me', {
      headers: { cookie: firstCookie },
    }, env)
    expect(me.status).toBe(200)
    await expect(me.json()).resolves.toMatchObject({ user: { email: 'owner@example.com' } })

    const nav = await app.request('/api/nav', {
      headers: { cookie: firstCookie },
    }, env)
    expect(nav.status).toBe(200)

    const logout = await app.request('/api/auth/logout', {
      method: 'POST',
      headers: { cookie: firstCookie },
    }, env)
    expect(logout.status).toBe(204)
    expect(logout.headers.get('set-cookie')).toContain('Max-Age=0')

    const rejected = await app.request('/api/nav', {
      headers: { cookie: firstCookie },
    }, env)
    expect(rejected.status).toBe(401)

    const login = await app.request('/api/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        email: 'owner@example.com',
        password: 'correct horse battery staple',
      }),
    }, env)
    expect(login.status).toBe(200)
    expect(login.headers.get('set-cookie')).toContain('dockmark_session=')
  })

  it('does not touch sessions on every authenticated request inside the touch threshold', async () => {
    const env = createMockEnv({ AUTH_MODE: 'builtin', SETUP_TOKEN: 'setup-secret' })
    const created = await app.request('/api/auth/setup', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(setupBody),
    }, env)
    const cookie = cookieFrom(created)

    await app.request('/api/nav', { headers: { cookie } }, env)
    await app.request('/api/nav', { headers: { cookie } }, env)

    expect(env.__testStore.authSessionTouchCount).toBe(0)
  })

  it('touches sessions when the last seen timestamp is outside the touch threshold', async () => {
    const env = createMockEnv({
      AUTH_MODE: 'builtin',
      SETUP_TOKEN: 'setup-secret',
      SESSION_TOUCH_INTERVAL_SECONDS: '1',
    })
    const created = await app.request('/api/auth/setup', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(setupBody),
    }, env)
    const cookie = cookieFrom(created)
    const session = env.__testStore.authSessions[0]

    if (!session) {
      throw new Error('Expected setup to create a session')
    }

    session.last_seen_at = '2026-05-29T00:00:00.000Z'

    await app.request('/api/nav', { headers: { cookie } }, env)

    expect(env.__testStore.authSessionTouchCount).toBe(1)
  })

  it('rejects invalid login credentials with a generic error', async () => {
    const env = createMockEnv({ AUTH_MODE: 'builtin', SETUP_TOKEN: 'setup-secret' })
    await app.request('/api/auth/setup', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(setupBody),
    }, env)

    const response = await app.request('/api/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        email: 'owner@example.com',
        password: 'wrong password',
      }),
    }, env)
    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toMatchObject({
      error: {
        code: 'auth_invalid_credentials',
        message: 'Invalid email or password',
      },
    })
  })

  it('rejects expired sessions', async () => {
    const env = createMockEnv({
      AUTH_MODE: 'builtin',
      SETUP_TOKEN: 'setup-secret',
      SESSION_TTL_SECONDS: '1',
    })
    const created = await app.request('/api/auth/setup', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(setupBody),
    }, env)
    const cookie = cookieFrom(created)

    await new Promise((resolve) => setTimeout(resolve, 1100))

    const response = await app.request('/api/nav', {
      headers: { cookie },
    }, env)
    expect(response.status).toBe(401)
  })

  it('fails closed for reserved auth modes', async () => {
    for (const mode of ['cloudflare-access', 'oidc'] as const) {
      const env = createMockEnv({ AUTH_MODE: mode })
      const setup = await app.request('/api/auth/setup', {}, env)
      expect(setup.status).toBe(200)
      await expect(setup.json()).resolves.toMatchObject({
        authMode: mode,
        supported: false,
      })

      const protectedResponse = await app.request('/api/nav', {}, env)
      expect(protectedResponse.status).toBe(503)
      await expect(protectedResponse.json()).resolves.toMatchObject({
        error: {
          code: 'config_error',
          message: expect.stringContaining('Use AUTH_MODE=builtin'),
        },
      })
    }
  })
})
