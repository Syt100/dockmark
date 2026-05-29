import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { describe, expect, it, vi } from 'vitest'

import ServiceEditorView from './ServiceEditorView.vue'

function createTestRouter() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/services', component: { template: '<div>services</div>' } },
      { path: '/services/new', component: ServiceEditorView },
    ],
  })

  router.push('/services/new')
  return router
}

describe('ServiceEditorView', () => {
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
