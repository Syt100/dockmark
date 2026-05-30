import { describe, expect, it } from 'vitest'

import { apiErrorCodes, type ApiErrorResponse, type HealthResponse } from './index'

describe('shared contracts', () => {
  it('allows a typed health response', () => {
    const response: HealthResponse = {
      ok: true,
      service: 'dockmark-worker',
      version: '0.1.0',
    }

    expect(response.service).toBe('dockmark-worker')
  })

  it('defines stable API error contracts', () => {
    const response: ApiErrorResponse = {
      error: {
        code: 'validation_failed',
        message: 'name is required',
      },
    }

    expect(apiErrorCodes).toContain(response.error.code)
  })
})
