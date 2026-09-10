import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'

import App from './App.vue'
import { currentUser } from './auth/state'

const RouterViewStub = defineComponent({
  name: 'RouterView',
  setup() {
    return () => h('section', { 'data-testid': 'route-page' }, 'Route page')
  },
})

describe('App route rendering', () => {
  afterEach(() => {
    currentUser.value = null
  })

  it('renders top-level route content directly without a transition viewport', () => {
    const wrapper = mount(App, {
      global: {
        stubs: {
          RouterLink: { template: '<a><slot /></a>' },
          RouterView: RouterViewStub,
          AppButton: true,
          ThemeToggle: true,
        },
      },
    })

    const routePage = wrapper.get('[data-testid="route-page"]')
    const pageShell = routePage.element.parentElement

    expect(pageShell?.className).toContain('px-[var(--dm-page-x)]')
    expect(wrapper.find('.dm-route-viewport').exists()).toBe(false)
    expect(wrapper.find('.dm-route-stage').exists()).toBe(false)
  })
})
