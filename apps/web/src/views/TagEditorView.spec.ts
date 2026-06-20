import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { afterEach, describe, expect, it, vi } from 'vitest'

import TagEditorView from './TagEditorView.vue'

function createTestRouter(path = '/tags/tag_public/edit') {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/tags', component: { template: '<div>tags</div>' } },
      { path: '/tags/new', name: 'tag-new', component: TagEditorView },
      { path: '/tags/:id/edit', name: 'tag-edit', component: TagEditorView },
    ],
  })

  router.push(path)
  return router
}

describe('TagEditorView', () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('loads the edited tag directly', async () => {
    vi.useFakeTimers()
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          tag: {
            id: 'tag_public',
            name: '公网',
            slug: 'public',
            createdAt: '2026-05-29T00:00:00.000Z',
          },
        }),
        { status: 200 },
      ),
    )
    vi.stubGlobal('fetch', fetchMock)

    const router = createTestRouter()
    await router.isReady()
    const wrapper = mount(TagEditorView, { global: { plugins: [router] } })

    await flushPromises()
    await vi.advanceTimersByTimeAsync(200)

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledWith('/api/tags/tag_public', expect.any(Object))
    expect(wrapper.text()).toContain('编辑标签')
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('公网')
  })

  it('shows a stable loading skeleton while loading an edited tag', async () => {
    vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockReturnValue(new Promise<Response>(() => {})))

    const router = createTestRouter()
    await router.isReady()
    const wrapper = mount(TagEditorView, { global: { plugins: [router] } })

    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('正在加载标签...')
    })

    expect(wrapper.find('.dm-editor-loading').exists()).toBe(true)
    expect(wrapper.findAll('.dm-skeleton').length).toBeGreaterThan(2)
    expect(wrapper.text()).not.toContain('标签名称')
  })

  it('shows not found feedback for a missing tag', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>().mockResolvedValue(
        new Response(
          JSON.stringify({
            error: {
              code: 'not_found',
              message: 'Tag not found',
            },
          }),
          {
            status: 404,
            headers: { 'content-type': 'application/json' },
          },
        ),
      ),
    )

    const router = createTestRouter()
    await router.isReady()
    const wrapper = mount(TagEditorView, { global: { plugins: [router] } })

    await flushPromises()

    expect(wrapper.text()).toContain('请求的数据不存在。')
  })
})
