import { describe, expect, it } from 'vitest'

import type { HealthResponse } from './index'

describe('shared contracts', () => {
  it('allows a typed health response', () => {
    const response: HealthResponse = {
      ok: true,
      service: 'dockmark-worker',
      version: '0.1.0',
    }

    expect(response.service).toBe('dockmark-worker')
  })
})
