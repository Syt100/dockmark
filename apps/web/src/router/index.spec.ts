import { describe, expect, it } from 'vitest'

import router from './index'

describe('service route consolidation', () => {
  it('redirects the legacy root entry to the canonical services route', () => {
    const root = router.getRoutes().find((route) => route.path === '/')

    expect(root?.redirect).toBe('/services')
  })

  it('keeps existing service editor URLs nested below the unified services route', () => {
    const paths = router.getRoutes().map((route) => route.path)

    expect(paths).toContain('/services')
    expect(paths).toContain('/services/new')
    expect(paths).toContain('/services/:id/edit')
  })
})
