import { describe, expect, it } from 'vitest'

import app from '../src/index'
import { createMockEnv } from './mock-env'

describe('worker health', () => {
  it('returns health payload', async () => {
    const response = await app.request('/api/health', {}, createMockEnv())

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      service: 'dockmark-worker',
      version: '0.1.0-test',
    })
  })
})
