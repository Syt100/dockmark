import { mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { describe, expect, it, vi } from 'vitest'

import TagsView from './TagsView.vue'

function createTestRouter() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: '/tags',
        name: 'tags',
        component: TagsView,
      },
    ],
  })

  router.push('/tags')
  return router
}

describe('TagsView', () => {
  it('filters tags by search query', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          tags: [
            {
              id: 'tag_public',
              name: '公网',
              slug: 'public',
              createdAt: '2026-05-29T00:00:00.000Z',
            },
            {
              id: 'tag_monitoring',
              name: '监控',
              slug: 'monitoring',
              createdAt: '2026-05-29T00:00:00.000Z',
            },
          ],
        }),
        { status: 200 },
      ),
    )

    vi.stubGlobal('fetch', fetchMock)

    const router = createTestRouter()
    await router.isReady()

    const wrapper = mount(TagsView, {
      global: {
        plugins: [router],
        stubs: {
          RouterView: true,
        },
      },
    })

    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('公网')
      expect(wrapper.text()).toContain('监控')
    })

    const input = wrapper.find('input[aria-label="搜索标签"]')
    expect(input.exists()).toBe(true)

    await input.setValue('monitor')

    expect(wrapper.text()).not.toContain('公网')
    expect(wrapper.text()).toContain('监控')

    await input.setValue('不存在')

    expect(wrapper.text()).toContain('没有符合搜索条件的标签')

    vi.unstubAllGlobals()
  })
})
