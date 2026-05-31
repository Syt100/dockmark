import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import ServiceNavCard from '../components/ServiceNavCard.vue'
import HomeView from './HomeView.vue'

describe('HomeView', () => {
  it('finds services by category name', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          categories: [
            {
              id: 'cat_photos',
              name: '照片分类',
              slug: 'photos',
              icon: null,
              color: null,
              sortOrder: 0,
              createdAt: '2026-05-29T00:00:00.000Z',
              updatedAt: '2026-05-29T00:00:00.000Z',
              items: [
                {
                  id: 'item_immich',
                  categoryId: 'cat_photos',
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
                  tags: [],
                  primaryEndpoint: {
                    id: 'end_1',
                    itemId: 'item_immich',
                    label: 'Public',
                    url: 'https://immich.example.com',
                    kind: 'public',
                    isPrimary: true,
                    sortOrder: 0,
                    createdAt: '2026-05-29T00:00:00.000Z',
                    updatedAt: '2026-05-29T00:00:00.000Z',
                  },
                  alternateEndpoints: [],
                },
              ],
            },
          ],
          uncategorized: [],
        }),
        { status: 200 },
      ),
    )

    vi.stubGlobal('fetch', fetchMock)

    const wrapper = mount(HomeView)
    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('Immich')
    })

    await wrapper.find('input').setValue('照片')

    expect(wrapper.text()).toContain('照片分类')
    expect(wrapper.text()).toContain('Immich')

    vi.unstubAllGlobals()
  })

  it('renders full service details for uncategorized cards', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          categories: [],
          uncategorized: [
            {
              id: 'item_vault',
              categoryId: null,
              name: 'Vaultwarden',
              description: '密码库',
              icon: '🔐',
              iconType: 'emoji',
              credentialHint: 'Vaultwarden 搜 Dockmark',
              note: null,
              status: 'active',
              sortOrder: 0,
              createdAt: '2026-05-29T00:00:00.000Z',
              updatedAt: '2026-05-29T00:00:00.000Z',
              tags: [
                {
                  id: 'tag_private',
                  name: '内网',
                  slug: 'private',
                  createdAt: '2026-05-29T00:00:00.000Z',
                },
              ],
              primaryEndpoint: {
                id: 'end_public',
                itemId: 'item_vault',
                label: '公网',
                url: 'https://vault.example.com',
                kind: 'public',
                isPrimary: true,
                sortOrder: 0,
                createdAt: '2026-05-29T00:00:00.000Z',
                updatedAt: '2026-05-29T00:00:00.000Z',
              },
              alternateEndpoints: [
                {
                  id: 'end_lan',
                  itemId: 'item_vault',
                  label: '内网',
                  url: 'http://vault.lan',
                  kind: 'lan',
                  isPrimary: false,
                  sortOrder: 1,
                  createdAt: '2026-05-29T00:00:00.000Z',
                  updatedAt: '2026-05-29T00:00:00.000Z',
                },
              ],
            },
          ],
        }),
        { status: 200 },
      ),
    )

    vi.stubGlobal('fetch', fetchMock)

    const wrapper = mount(HomeView)
    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('Vaultwarden')
    })

    expect(wrapper.text()).toContain('密码库')
    expect(wrapper.text()).toContain('公网')
    expect(wrapper.text()).toContain('内网')
    expect(wrapper.text()).not.toContain('公网 · 公网')
    expect(wrapper.text()).not.toContain('内网 · 内网')
    expect(wrapper.text()).toContain('Vaultwarden 搜 Dockmark')
    expect(wrapper.text()).toContain('内网')
    expect(wrapper.findComponent(ServiceNavCard).exists()).toBe(true)

    vi.unstubAllGlobals()
  })

  it('renders localized navigation categories from the Worker API', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          categories: [
            {
              id: 'cat_media',
              name: 'Media',
              slug: 'media',
              icon: null,
              color: null,
              sortOrder: 0,
              createdAt: '2026-05-29T00:00:00.000Z',
              updatedAt: '2026-05-29T00:00:00.000Z',
              items: [
                {
                  id: 'item_immich',
                  categoryId: 'cat_media',
                  name: 'Immich',
                  description: 'Photos',
                  icon: null,
                  iconType: 'emoji',
                  credentialHint: 'Vaultwarden search Immich',
                  note: null,
                  status: 'active',
                  sortOrder: 0,
                  createdAt: '2026-05-29T00:00:00.000Z',
                  updatedAt: '2026-05-29T00:00:00.000Z',
                  tags: [],
                  primaryEndpoint: {
                    id: 'end_1',
                    itemId: 'item_immich',
                    label: 'Public',
                    url: 'https://photos.example.com',
                    kind: 'public',
                    isPrimary: true,
                    sortOrder: 0,
                    createdAt: '2026-05-29T00:00:00.000Z',
                    updatedAt: '2026-05-29T00:00:00.000Z',
                  },
                  alternateEndpoints: [],
                },
              ],
            },
          ],
          uncategorized: [],
        }),
        {
          status: 200,
          headers: {
            'content-type': 'application/json',
          },
        },
      ),
    )

    vi.stubGlobal('fetch', fetchMock)

    const wrapper = mount(HomeView)
    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('Immich')
    })

    expect(wrapper.text()).toContain('服务导航')
    expect(wrapper.text()).toContain('打开')
    expect(wrapper.text()).toContain('公网')

    expect(fetchMock).toHaveBeenCalledWith('/api/nav', {
      headers: {
        'content-type': 'application/json',
      },
    })

    vi.unstubAllGlobals()
  })

  it('links to service creation from the empty state', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          categories: [],
          uncategorized: [],
        }),
        {
          status: 200,
          headers: {
            'content-type': 'application/json',
          },
        },
      ),
    )

    vi.stubGlobal('fetch', fetchMock)

    const wrapper = mount(HomeView, {
      global: {
        stubs: {
          RouterLink: {
            props: ['to'],
            template: '<a :href="to"><slot /></a>',
          },
        },
      },
    })

    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('还没有服务')
    })

    const link = wrapper.find('a[href="/services/new"]')
    expect(link.exists()).toBe(true)
    expect(link.text()).toContain('新建服务')

    vi.unstubAllGlobals()
  })
})
