import { mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { describe, expect, it, vi } from 'vitest'

import ServicesView from './ServicesView.vue'
import ServiceEditorView from './ServiceEditorView.vue'

function serviceItem(overrides: Record<string, unknown> = {}) {
  return {
    id: 'item_1',
    categoryId: null,
    name: 'Immich',
    description: null,
    icon: null,
    iconType: 'emoji',
    credentialHint: null,
    note: null,
    status: 'active',
    sortOrder: 0,
    createdAt: '2026-05-29T00:00:00.000Z',
    updatedAt: '2026-05-29T00:00:00.000Z',
    endpoints: [
      {
        id: 'endpoint_1',
        itemId: 'item_1',
        label: '公网',
        url: 'https://photos.example.com',
        kind: 'public',
        isPrimary: true,
        sortOrder: 0,
        createdAt: '2026-05-29T00:00:00.000Z',
        updatedAt: '2026-05-29T00:00:00.000Z',
      },
    ],
    tags: [],
    ...overrides,
  }
}

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
          {
            path: ':id/edit',
            name: 'service-edit',
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

  it('filters services by status with lightweight accessible controls', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockImplementation((input) => {
      const path = String(input)

      if (path === '/api/items') {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              items: [serviceItem()],
            }),
            { status: 200 },
          ),
        )
      }

      if (path === '/api/categories') {
        return Promise.resolve(new Response(JSON.stringify({ categories: [] }), { status: 200 }))
      }

      return Promise.resolve(new Response('{}', { status: 404 }))
    })

    vi.stubGlobal('fetch', fetchMock)

    const router = createTestRouter('/services')
    await router.isReady()

    const wrapper = mount(ServicesView, {
      global: {
        plugins: [router],
        stubs: {
          RouterView: true,
        },
      },
    })

    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('Immich')
    })

    expect(wrapper.find('label').exists()).toBe(false)
    expect(wrapper.find('input[aria-label="搜索服务"]').exists()).toBe(true)
    expect(wrapper.find('select[aria-label="按分类筛选服务"]').exists()).toBe(true)
    expect(wrapper.find('select[aria-label="按状态筛选服务"]').exists()).toBe(true)
    expect(wrapper.find('select[aria-label="按标签筛选服务"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('筛选')
    expect(wrapper.html()).toContain('whitespace-nowrap')
    expect(wrapper.html()).toContain('table-fixed')
    expect(wrapper.html()).toContain('lg:hidden')

    const selects = wrapper.findAll('select')
    await selects[1]?.setValue('archived')

    expect(wrapper.text()).toContain('没有符合筛选条件的服务')
    expect(wrapper.findAll('article').some((article) => article.text().includes('Immich'))).toBe(false)

    vi.unstubAllGlobals()
  })

  it('reloads services after returning from a successful create flow', async () => {
    let itemsRequestCount = 0
    const fetchMock = vi.fn<typeof fetch>().mockImplementation((input) => {
      const path = String(input)

      if (path === '/api/items') {
        itemsRequestCount += 1
        return Promise.resolve(
          new Response(
            JSON.stringify({
              items: itemsRequestCount === 1 ? [] : [serviceItem({ id: 'item_created', name: '新服务' })],
            }),
            { status: 200 },
          ),
        )
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
      expect(fetchMock).toHaveBeenCalledWith('/api/items', {
        headers: {
          'content-type': 'application/json',
        },
      })
    })

    await router.push({ path: '/services', query: { saved: 'created' } })

    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('新服务')
    })

    expect(itemsRequestCount).toBeGreaterThanOrEqual(2)
    expect(wrapper.text()).toContain('服务已创建')

    vi.unstubAllGlobals()
  })
})
