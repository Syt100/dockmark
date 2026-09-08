import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'

import App from './App.vue'
import { currentUser } from './auth/state'

const RoutePage = defineComponent({
  name: 'RoutePage',
  setup() {
    return () => h('section', { 'data-testid': 'route-page' }, 'Route page')
  },
})

const RouterViewStub = defineComponent({
  name: 'RouterView',
  setup(_, { slots }) {
    return () =>
      slots.default?.({
        Component: RoutePage,
        route: { matched: [{ path: '/services' }], fullPath: '/services' },
      })
  },
})

describe('App route transition structure', () => {
  afterEach(() => {
    currentUser.value = null
  })

  it('keeps the absolute transition viewport inside the padded page shell', () => {
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

    const viewport = wrapper.get('.dm-route-viewport')
    const stage = wrapper.get('.dm-route-stage')
    const pageShell = viewport.element.parentElement

    expect(viewport.classes()).toContain('relative')
    expect(stage.exists()).toBe(true)
    expect(pageShell?.className).toContain('px-[var(--dm-page-x)]')
    expect(viewport.element.className).not.toContain('px-[var(--dm-page-x)]')
  })
})
