import { describe, expect, it } from 'vitest'

import { routeTransitionKey } from './motion'

describe('routeTransitionKey', () => {
  it('keeps nested editor routes on the same top-level transition key', () => {
    expect(
      routeTransitionKey({
        matched: [{ path: '/services' }, { path: '/services/new' }],
        fullPath: '/services/new',
      }),
    ).toBe('/services')
  })

  it('falls back to fullPath when a route has not been matched yet', () => {
    expect(routeTransitionKey({ matched: [], fullPath: '/login?redirect=/services' })).toBe(
      '/login?redirect=/services',
    )
  })
})
