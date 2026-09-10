import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ListLoadingSkeleton from './ListLoadingSkeleton.vue'

describe('ListLoadingSkeleton', () => {
  it('uses list layout by default', () => {
    const wrapper = mount(ListLoadingSkeleton, {
      props: { label: '正在加载...' },
    })

    expect(wrapper.find('[data-loading-layout="cards"]').exists()).toBe(false)
    expect(wrapper.findAll('[data-loading-layout="list"]')).toHaveLength(2)
  })

  it('renders card layout when explicitly selected', () => {
    const wrapper = mount(ListLoadingSkeleton, {
      props: { label: '正在加载服务...', variant: 'cards' },
    })

    expect(wrapper.find('[data-loading-layout="cards"]').exists()).toBe(true)
    expect(wrapper.find('[data-loading-layout="list"]').exists()).toBe(false)
  })
})
