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

  it('serves the SPA entry for non-API routes', async () => {
    const response = await app.request('/services/new', {}, createMockEnv())

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('text/html')
    await expect(response.text()).resolves.toContain('id="app"')
  })

  it('serves the SPA entry for HEAD requests to non-API routes', async () => {
    const response = await app.request('/services/new', { method: 'HEAD' }, createMockEnv())

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('text/html')
  })

  it('keeps API not found responses separate from the SPA fallback', async () => {
    const response = await app.request('/api/missing', {}, createMockEnv())

    expect(response.status).toBe(404)
    await expect(response.json()).resolves.toMatchObject({
      error: {
        code: 'not_found',
        message: 'Not found',
      },
    })
  })
})
