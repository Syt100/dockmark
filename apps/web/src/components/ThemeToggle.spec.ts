import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'

import ThemeToggle from './ThemeToggle.vue'

describe('ThemeToggle', () => {
  afterEach(() => {
    document.documentElement.className = ''
    localStorage.clear()
  })

  it('toggles the dark class and persists the preference', async () => {
    const wrapper = mount(ThemeToggle)
    const button = wrapper.get('button')

    await button.trigger('click')

    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(localStorage.getItem('dockmark-theme')).toBe('dark')
    expect(button.attributes('aria-label')).toBe('切换到浅色模式')

    await button.trigger('click')

    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(localStorage.getItem('dockmark-theme')).toBe('light')
  })
})
