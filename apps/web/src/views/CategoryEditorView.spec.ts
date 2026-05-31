import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { afterEach, describe, expect, it, vi } from 'vitest'

import CategoryEditorView from './CategoryEditorView.vue'

function createTestRouter(path = '/categories/cat_media/edit') {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/categories', component: { template: '<div>categories</div>' } },
      { path: '/categories/new', name: 'category-new', component: CategoryEditorView },
      { path: '/categories/:id/edit', name: 'category-edit', component: CategoryEditorView },
    ],
  })

  router.push(path)
  return router
}

describe('CategoryEditorView', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('loads the edited category directly', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          category: {
            id: 'cat_media',
            name: '媒体',
            slug: 'media',
            icon: '',
            color: null,
            sortOrder: 7,
            createdAt: '2026-05-29T00:00:00.000Z',
            updatedAt: '2026-05-29T00:00:00.000Z',
          },
        }),
        { status: 200 },
      ),
    )
    vi.stubGlobal('fetch', fetchMock)

    const router = createTestRouter()
    await router.isReady()
    const wrapper = mount(CategoryEditorView, { global: { plugins: [router] } })

    await flushPromises()

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledWith('/api/categories/cat_media', expect.any(Object))
    expect(wrapper.text()).toContain('编辑分类')
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('媒体')
  })

  it('shows a stable loading skeleton while loading an edited category', async () => {
    vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockReturnValue(new Promise<Response>(() => {})))

    const router = createTestRouter()
    await router.isReady()
    const wrapper = mount(CategoryEditorView, { global: { plugins: [router] } })

    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('正在加载分类...')
    })

    expect(wrapper.find('.dm-editor-loading').exists()).toBe(true)
    expect(wrapper.findAll('.dm-skeleton').length).toBeGreaterThan(4)
    expect(wrapper.text()).not.toContain('分类名称')
  })

  it('shows not found feedback for a missing category', async () => {
    vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          error: {
            code: 'not_found',
            message: 'Category not found',
          },
        }),
        {
          status: 404,
          headers: { 'content-type': 'application/json' },
        },
      ),
    ))

    const router = createTestRouter()
    await router.isReady()
    const wrapper = mount(CategoryEditorView, { global: { plugins: [router] } })

    await flushPromises()

    expect(wrapper.text()).toContain('请求的数据不存在。')
  })
})
