import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import HomeView from './HomeView.vue'

describe('HomeView', () => {
  it('checks the Worker health endpoint', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          ok: true,
          service: 'dockmark-worker',
          version: '0.1.0-test',
        }),
        {
          status: 200,
          headers: {
            'content-type': 'application/json',
          },
        },
      ),
    )

    vi.stubGlobal('fetch', fetchMock)

    const wrapper = mount(HomeView)
    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('dockmark-worker is reachable')
    })

    expect(fetchMock).toHaveBeenCalledWith('/api/health')

    vi.unstubAllGlobals()
  })
})
