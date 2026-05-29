import { describe, expect, it } from 'vitest'

import app from '../src/index'
import { createMockEnv } from './mock-env'

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
