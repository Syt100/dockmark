import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import ThemeToggle from './ThemeToggle.vue'

function stubColorScheme(matches: boolean) {
  window.matchMedia = vi.fn<typeof window.matchMedia>().mockReturnValue({
    matches,
    media: '(prefers-color-scheme: dark)',
    onchange: null,
    addEventListener: vi.fn<MediaQueryList['addEventListener']>(),
    removeEventListener: vi.fn<MediaQueryList['removeEventListener']>(),
    addListener: vi.fn<MediaQueryList['addListener']>(),
    removeListener: vi.fn<MediaQueryList['removeListener']>(),
    dispatchEvent: vi.fn<MediaQueryList['dispatchEvent']>(),
  })
}

describe('ThemeToggle', () => {
  beforeEach(() => {
    stubColorScheme(false)
  })

  afterEach(() => {
    document.documentElement.className = ''
    localStorage.clear()
    vi.restoreAllMocks()
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

  it('uses the system dark preference when no preference is stored', () => {
    stubColorScheme(true)

    const wrapper = mount(ThemeToggle)

    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(localStorage.getItem('dockmark-theme')).toBe('dark')
    expect(wrapper.get('button').attributes('aria-label')).toBe('切换到浅色模式')
  })
})
