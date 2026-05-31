import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { afterEach, describe, expect, it, vi } from 'vitest'

import CategoriesView from './CategoriesView.vue'

function createTestRouter(path = '/categories') {
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

  router.push(path)
  return router
}

describe('CategoriesView', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

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
  })

  it('shows saved feedback and reloads after returning from an editor', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          categories: [],
        }),
        { status: 200 },
      ),
    )
    vi.stubGlobal('fetch', fetchMock)

    const router = createTestRouter('/categories?saved=updated')
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
      expect(wrapper.text()).toContain('分类已保存')
    })
    expect(fetchMock).toHaveBeenCalledTimes(1)

    await router.push('/categories/new')
    await router.push('/categories?saved=created')

    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('分类已创建')
      expect(fetchMock).toHaveBeenCalledTimes(2)
    })
  })

  it('deletes categories through confirmation feedback and reloads', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockImplementation((input, init) => {
      if (String(input) === '/api/categories/cat_media' && init?.method === 'DELETE') {
        return Promise.resolve(new Response(null, { status: 204 }))
      }

      return Promise.resolve(
        new Response(
          JSON.stringify({
            categories: [
              {
                id: 'cat_media',
                name: '媒体与相册',
                slug: 'media',
                icon: '',
                color: null,
                sortOrder: 10,
                createdAt: '2026-05-29T00:00:00.000Z',
                updatedAt: '2026-05-29T00:00:00.000Z',
              },
            ],
          }),
          { status: 200 },
        ),
      )
    })
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
    })

    await wrapper.findAll('button').find((button) => button.text() === '删除')?.trigger('click')
    await vi.waitFor(() => {
      expect(document.body.textContent).toContain('确认删除分类“媒体与相册”？服务会变为未分类。')
    })
    ;(Array.from(document.querySelectorAll('button')).find((button) => button.textContent === '确认删除') as HTMLButtonElement).click()
    await flushPromises()

    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('分类已删除')
    })
    expect(fetchMock).toHaveBeenCalledWith('/api/categories/cat_media', expect.objectContaining({ method: 'DELETE' }))
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })
})
