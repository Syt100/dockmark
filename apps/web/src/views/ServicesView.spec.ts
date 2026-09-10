import { mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { describe, expect, it, vi } from 'vitest'

import ServicesView from './ServicesView.vue'
import ServiceEditorView from './ServiceEditorView.vue'

function serviceItem(overrides: Record<string, unknown> = {}) {
  return {
    id: 'item_1',
    categoryId: 'cat_photos',
    name: 'Immich',
    description: '照片服务',
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

function mockServices(items = [serviceItem()]) {
  return vi.fn<typeof fetch>().mockImplementation((input) => {
    const path = String(input)

    if (path === '/api/items') {
      return Promise.resolve(new Response(JSON.stringify({ items }), { status: 200 }))
    }

    if (path === '/api/categories') {
      return Promise.resolve(
        new Response(
          JSON.stringify({
            categories: [
              {
                id: 'cat_photos',
                name: '照片分类',
                slug: 'photos',
                icon: '📷',
                color: null,
                sortOrder: 0,
                createdAt: '2026-05-29T00:00:00.000Z',
                updatedAt: '2026-05-29T00:00:00.000Z',
              },
            ],
          }),
          { status: 200 },
        ),
      )
    }

    if (path === '/api/tags') {
      return Promise.resolve(new Response(JSON.stringify({ tags: [] }), { status: 200 }))
    }

    return Promise.resolve(new Response('{}', { status: 404 }))
  })
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
          { path: 'new', name: 'service-new', component: ServiceEditorView },
          { path: ':id/edit', name: 'service-edit', component: ServiceEditorView },
        ],
      },
    ],
  })

  router.push(initialPath)
  return router
}

describe('ServicesView', () => {
  it('uses one shared card view by default with filters visually collapsed and card editing available', async () => {
    const fetchMock = mockServices()
    vi.stubGlobal('fetch', fetchMock)

    const router = createTestRouter('/services')
    await router.isReady()
    const wrapper = mount(ServicesView, { global: { plugins: [router] } })

    await vi.waitFor(() => expect(wrapper.text()).toContain('Immich'))

    expect(wrapper.text()).toContain('照片分类')
    expect(wrapper.find('[aria-label="卡片视图"]').attributes('aria-pressed')).toBe('true')
    expect(wrapper.find('[aria-label="列表视图"]').attributes('aria-pressed')).toBe('false')
    expect(wrapper.find('[aria-label="展开筛选"]').exists()).toBe(true)
    expect(wrapper.get('[data-service-filter-collapse]').attributes('data-state')).toBe('closed')
    expect(wrapper.get('#service-filters').attributes('aria-hidden')).toBe('true')
    expect(wrapper.find('a[aria-label="编辑服务"]').attributes('href')).toBe(
      '/services/item_1/edit',
    )

    vi.unstubAllGlobals()
  })

  it('expands and collapses the shared filter form without replacing the collapse container', async () => {
    vi.stubGlobal('fetch', mockServices())
    const router = createTestRouter('/services')
    await router.isReady()
    const wrapper = mount(ServicesView, { global: { plugins: [router] } })

    await vi.waitFor(() => expect(wrapper.text()).toContain('Immich'))
    const collapse = wrapper.get('[data-service-filter-collapse]')
    const filterPanel = wrapper.get('#service-filters')

    await wrapper.get('[aria-label="展开筛选"]').trigger('click')

    expect(collapse.attributes('data-state')).toBe('open')
    expect(filterPanel.attributes('aria-hidden')).toBe('false')
    expect(wrapper.find('input[aria-label="搜索服务"]').exists()).toBe(true)
    expect(wrapper.find('select[aria-label="按分类筛选服务"]').exists()).toBe(true)
    expect(wrapper.find('select[aria-label="按状态筛选服务"]').exists()).toBe(true)
    expect(wrapper.find('select[aria-label="按标签筛选服务"]').exists()).toBe(true)

    await wrapper.get('input[aria-label="搜索服务"]').setValue('不存在')
    expect(wrapper.text()).toContain('没有符合筛选条件的服务')

    await wrapper.get('[aria-label="收起筛选"]').trigger('click')

    expect(collapse.attributes('data-state')).toBe('closed')
    expect(filterPanel.attributes('aria-hidden')).toBe('true')
    expect(wrapper.find('[data-service-filter-collapse]').exists()).toBe(true)

    vi.unstubAllGlobals()
  })

  it('switches to a list rendering without reloading the shared service data', async () => {
    const fetchMock = mockServices()
    vi.stubGlobal('fetch', fetchMock)
    const router = createTestRouter('/services')
    await router.isReady()
    const wrapper = mount(ServicesView, { global: { plugins: [router] } })

    await vi.waitFor(() => expect(wrapper.text()).toContain('Immich'))
    const itemsRequestsBefore = fetchMock.mock.calls.filter(
      ([input]) => String(input) === '/api/items',
    ).length

    await wrapper.get('[aria-label="列表视图"]').trigger('click')
    await vi.waitFor(() => expect(router.currentRoute.value.query.view).toBe('list'))

    expect(wrapper.find('table').exists()).toBe(true)
    expect(wrapper.find('[aria-label="列表视图"]').attributes('aria-pressed')).toBe('true')
    expect(fetchMock.mock.calls.filter(([input]) => String(input) === '/api/items')).toHaveLength(
      itemsRequestsBefore,
    )

    vi.unstubAllGlobals()
  })

  it('preserves list view while entering and leaving the service editor', async () => {
    vi.stubGlobal('fetch', mockServices())
    const router = createTestRouter('/services?view=list')
    await router.isReady()
    const wrapper = mount(ServicesView, { global: { plugins: [router] } })

    await vi.waitFor(() => expect(wrapper.text()).toContain('Immich'))
    const editLink = wrapper.findAll('a').find((link) => link.text() === '编辑')
    expect(editLink?.attributes('href')).toContain('view=list')

    await router.push('/services/item_1/edit?view=list')
    await router.push({ path: '/services', query: { saved: 'updated', view: 'list' } })

    expect(router.currentRoute.value.query.view).toBe('list')

    vi.unstubAllGlobals()
  })
})
