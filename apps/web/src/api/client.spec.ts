import { afterEach, describe, expect, it, vi } from 'vitest'

import { ApiError, jsonRequest, request } from './client'

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

  it('serializes JSON request bodies while preserving caller headers', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    await expect(jsonRequest('/api/example', {
      method: 'POST',
      body: { name: 'Dockmark' },
      headers: {
        'x-test': '1',
      },
    })).resolves.toEqual({ ok: true })

    expect(fetchMock).toHaveBeenCalledWith('/api/example', {
      method: 'POST',
      body: JSON.stringify({ name: 'Dockmark' }),
      headers: {
        'content-type': 'application/json',
        'x-test': '1',
      },
    })
  })

  it('returns undefined for empty 204 responses', async () => {
    vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockResolvedValue(
      new Response(null, { status: 204 }),
    ))

    await expect(request('/api/tags/tag_1', { method: 'DELETE' })).resolves.toBeUndefined()
  })
})
