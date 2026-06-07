import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ServiceNavCard from './ServiceNavCard.vue'

describe('ServiceNavCard', () => {
  it('top-aligns the service icon with the title when descriptions wrap', () => {
    const wrapper = mount(ServiceNavCard, {
      props: {
        item: {
          id: 'item_immich',
          categoryId: null,
          name: 'Immich',
          description: '照片备份、家庭相册与移动端同步。这个描述可能会在窄卡片里换成多行。',
          icon: null,
          iconType: 'favicon',
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
            label: '公网',
            url: 'https://photos.example.test',
            kind: 'public',
            isPrimary: true,
            sortOrder: 0,
            createdAt: '2026-05-29T00:00:00.000Z',
            updatedAt: '2026-05-29T00:00:00.000Z',
          },
          alternateEndpoints: [],
        },
      },
    })

    expect(wrapper.find('.flex.min-w-0.flex-1').classes()).toContain('items-start')
    expect(wrapper.find('.flex.min-w-0.flex-1').classes()).not.toContain('items-center')
  })
})
