import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import AppIconButton from './AppIconButton.vue'

describe('AppIconButton', () => {
  it('keeps expanded state styling tied to aria-expanded', () => {
    const wrapper = mount(AppIconButton, {
      props: { label: '筛选' },
      attrs: { 'aria-expanded': 'true' },
    })

    expect(wrapper.get('button').attributes('aria-expanded')).toBe('true')
    expect(wrapper.get('button').classes()).toContain('aria-expanded:bg-[var(--dm-primary-soft)]')
    expect(wrapper.get('button').classes()).toContain('aria-expanded:text-[var(--dm-primary)]')
  })
})
