import { afterEach, describe, expect, it, vi } from 'vitest'

import { ApiError, request } from './client'

describe('api client', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('parses structured JSON errors', async () => {
    vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({
        error: {
          code: 'validation_failed',
          message: 'name is required',
          fields: {
            name: ['name is required'],
          },
        },
      }), {
        status: 400,
        headers: { 'content-type': 'application/json' },
      }),
    ))

    await expect(request('/api/tags')).rejects.toMatchObject({
      status: 400,
      code: 'validation_failed',
      message: 'name is required',
      fields: {
        name: ['name is required'],
      },
    } satisfies Partial<ApiError>)
  })

  it('falls back to text for non-structured JSON errors', async () => {
    vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ message: 'legacy error' }), {
        status: 500,
        headers: { 'content-type': 'application/json' },
      }),
    ))

    await expect(request('/api/tags')).rejects.toMatchObject({
      status: 500,
      message: '{"message":"legacy error"}',
    } satisfies Partial<ApiError>)
  })
})
