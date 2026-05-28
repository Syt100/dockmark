import { describe, expect, it } from 'vitest'

import app from '../src/index'
import type { Bindings } from '../src/lib/env'

const env = {
  AUTH_MODE: 'development',
  APP_VERSION: '0.1.0-test',
} as Bindings

describe('worker health', () => {
  it('returns health payload', async () => {
    const response = await app.request('/api/health', {}, env)

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      service: 'dockmark-worker',
      version: '0.1.0-test',
    })
  })
})
