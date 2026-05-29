import { mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { describe, expect, it, vi } from 'vitest'

import CategoriesView from './CategoriesView.vue'

function createTestRouter() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: '/categories',
        name: 'categories',
        component: CategoriesView,
      },
    ],
  })

  router.push('/categories')
  return router
}

describe('CategoriesView', () => {
  it('filters categories by search query', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          categories: [
            {
              id: 'cat_media',
              name: '媒体与相册',
              slug: 'media',
              icon: '🎞️',
              color: '#2563eb',
              sortOrder: 10,
              createdAt: '2026-05-29T00:00:00.000Z',
              updatedAt: '2026-05-29T00:00:00.000Z',
            },
            {
              id: 'cat_infra',
              name: '基础设施',
              slug: 'infrastructure',
              icon: '🧰',
              color: '#475569',
              sortOrder: 20,
              createdAt: '2026-05-29T00:00:00.000Z',
              updatedAt: '2026-05-29T00:00:00.000Z',
            },
          ],
        }),
        { status: 200 },
      ),
    )

    vi.stubGlobal('fetch', fetchMock)

    const router = createTestRouter()
    await router.isReady()

    const wrapper = mount(CategoriesView, {
      global: {
        plugins: [router],
        stubs: {
          RouterView: true,
        },
      },
    })

    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('媒体与相册')
      expect(wrapper.text()).toContain('基础设施')
    })

    const input = wrapper.find('input[aria-label="搜索分类"]')
    expect(input.exists()).toBe(true)

    await input.setValue('infra')

    expect(wrapper.text()).not.toContain('媒体与相册')
    expect(wrapper.text()).toContain('基础设施')

    await input.setValue('不存在')

    expect(wrapper.text()).toContain('没有符合搜索条件的分类')

    vi.unstubAllGlobals()
  })
})
