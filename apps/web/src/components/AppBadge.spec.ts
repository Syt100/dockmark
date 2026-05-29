import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import AppBadge from './AppBadge.vue'

describe('AppBadge', () => {
  it('renders tone-backed badge content', () => {
    const wrapper = mount(AppBadge, {
      props: {
        tone: 'primary',
      },
      slots: {
        default: '内网',
      },
    })

    expect(wrapper.text()).toBe('内网')
    expect(wrapper.classes()).toContain('bg-[var(--dm-primary-soft)]')
    expect(wrapper.classes()).toContain('text-[var(--dm-primary)]')
  })
})
