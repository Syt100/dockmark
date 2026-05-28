import { describe, expect, it } from 'vitest'

import app from '../src/index'
import type { Bindings } from '../src/lib/env'

function createMockEnv(): Bindings {
  const store = new Map<string, string>()

  return {
    AUTH_MODE: 'development',
    APP_VERSION: '0.1.0-test',
    ASSETS: {} as Fetcher,
    DB: {
      prepare: () => ({
        bind: () => ({
          first: () => Promise.resolve({ value: '0' }),
        }),
      }),
    } as unknown as D1Database,
    KV: {
      put: (key: string, value: string) => {
        store.set(key, value)
        return Promise.resolve()
      },
      get: (key: string) => Promise.resolve(store.get(key) ?? null),
    } as unknown as KVNamespace,
  }
}

describe('worker smoke endpoint', () => {
  it('checks authenticated D1 and KV access', async () => {
    const response = await app.request('/api/smoke', {}, createMockEnv())

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      d1: 'reachable',
      kv: 'reachable',
    })
  })
})
