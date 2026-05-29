import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import HomeView from './HomeView.vue'

describe('HomeView', () => {
  it('renders navigation categories from the Worker API', async () => {
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

    expect(fetchMock).toHaveBeenCalledWith('/api/nav', {
      headers: {
        'content-type': 'application/json',
      },
    })

    vi.unstubAllGlobals()
  })
})
