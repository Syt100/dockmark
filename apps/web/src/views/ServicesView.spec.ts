import { mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { describe, expect, it, vi } from 'vitest'

import ServicesView from './ServicesView.vue'
import ServiceEditorView from './ServiceEditorView.vue'

function createTestRouter(initialPath: string) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: '/services',
        name: 'services',
        component: ServicesView,
        children: [
          {
            path: 'new',
            name: 'service-new',
            component: ServiceEditorView,
          },
        ],
      },
    ],
  })

  router.push(initialPath)
  return router
}

describe('ServicesView', () => {
  it('renders the route-driven service editor shell on create routes', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockImplementation((input) => {
      const path = String(input)

      if (path === '/api/items') {
        return Promise.resolve(new Response(JSON.stringify({ items: [] }), { status: 200 }))
      }

      if (path === '/api/categories') {
        return Promise.resolve(new Response(JSON.stringify({ categories: [] }), { status: 200 }))
      }

      if (path === '/api/tags') {
        return Promise.resolve(new Response(JSON.stringify({ tags: [] }), { status: 200 }))
      }

      return Promise.resolve(new Response('{}', { status: 404 }))
    })

    vi.stubGlobal('fetch', fetchMock)

    const router = createTestRouter('/services/new')
    await router.isReady()

    const wrapper = mount(ServicesView, {
      global: {
        plugins: [router],
      },
    })

    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('服务名称')
    })

    expect(wrapper.text()).toContain('新建服务')
    expect(wrapper.html()).toContain('role="dialog"')
    expect(wrapper.html()).toContain('md:hidden')

    vi.unstubAllGlobals()
  })
})
