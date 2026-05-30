import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  authSetupStatus,
  clearAuthBootstrap,
  currentUser,
  loadAuthState,
  signIn,
  signOut,
} from './state'

describe('auth state', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    currentUser.value = null
    authSetupStatus.value = null
    clearAuthBootstrap()
  })

  it('loads setup status and current user', async () => {
    const responses = [
      new Response(JSON.stringify({
        authMode: 'builtin',
        needsSetup: false,
        supported: true,
      })),
      new Response(JSON.stringify({
        user: {
          id: 'user_1',
          email: 'owner@example.com',
          mode: 'builtin',
        },
      })),
    ]
    const fetchMock = vi.fn<typeof fetch>(async () => responses.shift() ?? new Response(null, { status: 500 }))

    vi.stubGlobal('fetch', fetchMock)

    await loadAuthState()

    expect(authSetupStatus.value?.needsSetup).toBe(false)
    expect(currentUser.value?.email).toBe('owner@example.com')
  })

  it('signs in and refreshes auth state', async () => {
    const responses = [
      new Response(JSON.stringify({
        user: {
          id: 'user_1',
          email: 'owner@example.com',
          mode: 'builtin',
        },
      })),
      new Response(JSON.stringify({
        authMode: 'builtin',
        needsSetup: false,
        supported: true,
      })),
      new Response(JSON.stringify({
        user: {
          id: 'user_1',
          email: 'owner@example.com',
          mode: 'builtin',
        },
      })),
    ]
    const fetchMock = vi.fn<typeof fetch>(async () => responses.shift() ?? new Response(null, { status: 500 }))

    vi.stubGlobal('fetch', fetchMock)

    await signIn({
      email: 'owner@example.com',
      password: 'correct horse battery staple',
    })

    expect(fetchMock).toHaveBeenCalledWith('/api/auth/login', expect.objectContaining({ method: 'POST' }))
    expect(currentUser.value?.email).toBe('owner@example.com')
  })

  it('signs out and clears user state', async () => {
    currentUser.value = {
      id: 'user_1',
      email: 'owner@example.com',
      mode: 'builtin',
    }

    const responses = [
      new Response(null, { status: 204 }),
      new Response(JSON.stringify({
        authMode: 'builtin',
        needsSetup: false,
        supported: true,
      })),
      new Response(JSON.stringify({ user: null })),
    ]
    const fetchMock = vi.fn<typeof fetch>(async () => responses.shift() ?? new Response(null, { status: 500 }))

    vi.stubGlobal('fetch', fetchMock)

    await signOut()

    expect(fetchMock).toHaveBeenCalledWith('/api/auth/logout', expect.objectContaining({ method: 'POST' }))
    expect(currentUser.value).toBe(null)
  })
})
