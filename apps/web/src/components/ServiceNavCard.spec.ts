import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ServiceNavCard from './ServiceNavCard.vue'

const item = {
  id: 'item_immich',
  categoryId: null,
  name: 'Immich',
  description: '照片备份、家庭相册与移动端同步。这个描述可能会在窄卡片里换成多行。',
  icon: null,
  iconType: 'favicon' as const,
  credentialHint: null,
  note: null,
  status: 'active' as const,
  sortOrder: 0,
  createdAt: '2026-05-29T00:00:00.000Z',
  updatedAt: '2026-05-29T00:00:00.000Z',
  tags: [],
  endpoints: [
    {
      id: 'end_1',
      itemId: 'item_immich',
      label: '公网',
      url: 'https://photos.example.test',
      kind: 'public' as const,
      isPrimary: true,
      sortOrder: 0,
      createdAt: '2026-05-29T00:00:00.000Z',
      updatedAt: '2026-05-29T00:00:00.000Z',
    },
  ],
}

describe('ServiceNavCard', () => {
  it('top-aligns the service icon and exposes an icon-only edit action', () => {
    const wrapper = mount(ServiceNavCard, {
      props: {
        item,
        editTo: '/services/item_immich/edit',
      },
      global: {
        stubs: {
          RouterLink: {
            props: ['to'],
            template: '<a :href="to"><slot /></a>',
          },
        },
      },
    })

    expect(wrapper.find('.flex.min-w-0.flex-1').classes()).toContain('items-start')
    expect(wrapper.get('a[aria-label="编辑服务"]').attributes('href')).toBe(
      '/services/item_immich/edit',
    )
    expect(wrapper.get('a[aria-label="编辑服务"]').text()).toBe('')
  })
})
