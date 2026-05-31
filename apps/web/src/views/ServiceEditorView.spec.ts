import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { describe, expect, it, vi } from 'vitest'

import ServiceEditorView from './ServiceEditorView.vue'

function createTestRouter(initialPath = '/services/new') {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/services', component: { template: '<div>services</div>' } },
      { path: '/services/new', component: ServiceEditorView },
      { path: '/services/:id/edit', component: ServiceEditorView },
    ],
  })

  router.push(initialPath)
  return router
}

describe('ServiceEditorView', () => {
  it('shows the create form while category and tag references are still loading', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockImplementation((input) => {
      const path = String(input)

      if (path === '/api/categories' || path === '/api/tags') {
        return new Promise<Response>(() => {})
      }

      return Promise.resolve(new Response('{}', { status: 404 }))
    })

    vi.stubGlobal('fetch', fetchMock)

    const router = createTestRouter()
    await router.isReady()

    const wrapper = mount(ServiceEditorView, {
      global: {
        plugins: [router],
      },
    })

    await vi.waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/categories', {
        headers: {
          'content-type': 'application/json',
        },
      })
    })

    expect(wrapper.text()).toContain('服务名称')
    expect(wrapper.text()).toContain('访问地址')
    expect(wrapper.text()).toContain('标签加载中...')
    expect(wrapper.text()).not.toContain('正在加载服务信息...')

    vi.unstubAllGlobals()
  })

  it('keeps the edit form in a loading state until the service record is loaded', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockImplementation((input) => {
      const path = String(input)

      if (path === '/api/categories') {
        return Promise.resolve(new Response(JSON.stringify({ categories: [] }), { status: 200 }))
      }

      if (path === '/api/tags') {
        return Promise.resolve(new Response(JSON.stringify({ tags: [] }), { status: 200 }))
      }

      if (path === '/api/items/item_1') {
        return new Promise<Response>(() => {})
      }

      return Promise.resolve(new Response('{}', { status: 404 }))
    })

    vi.stubGlobal('fetch', fetchMock)

    const router = createTestRouter('/services/item_1/edit')
    await router.isReady()

    const wrapper = mount(ServiceEditorView, {
      global: {
        plugins: [router],
      },
    })

    await vi.waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/items/item_1', {
        headers: {
          'content-type': 'application/json',
        },
      })
    })

    expect(wrapper.text()).toContain('正在加载服务信息...')
    expect(wrapper.text()).not.toContain('访问地址')

    vi.unstubAllGlobals()
  })

  it('shows searchable compact tag selection when many tags exist', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockImplementation((input) => {
      const path = String(input)

      if (path === '/api/categories') {
        return Promise.resolve(new Response(JSON.stringify({ categories: [] }), { status: 200 }))
      }

      if (path === '/api/tags') {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              tags: Array.from({ length: 9 }, (_, index) => ({
                id: `tag_${index}`,
                name: index === 8 ? '监控' : `标签 ${index}`,
                slug: index === 8 ? 'monitoring' : `tag-${index}`,
                createdAt: '2026-05-29T00:00:00.000Z',
              })),
            }),
            { status: 200 },
          ),
        )
      }

      return Promise.resolve(new Response('{}', { status: 404 }))
    })

    vi.stubGlobal('fetch', fetchMock)

    const router = createTestRouter()
    await router.isReady()

    const wrapper = mount(ServiceEditorView, {
      global: {
        plugins: [router],
      },
    })

    await flushPromises()

    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('已选 0 个')
    })

    const input = wrapper.get('input[aria-label="搜索标签"]')
    await input.setValue('monitor')

    expect(wrapper.text()).toContain('监控')
    expect(wrapper.text()).not.toContain('标签 1')

    vi.unstubAllGlobals()
  })
})
