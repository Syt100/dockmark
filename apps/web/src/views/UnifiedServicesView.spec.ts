import { shallowMount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { describe, expect, it } from 'vitest'

import UnifiedServicesView from './UnifiedServicesView.vue'

async function mountUnified(path = '/services') {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: '/services',
        name: 'services',
        component: UnifiedServicesView,
        children: [
          { path: 'new', name: 'service-new', component: { template: '<div />' } },
          { path: ':id/edit', name: 'service-edit', component: { template: '<div />' } },
        ],
      },
    ],
  })

  await router.push(path)
  await router.isReady()

  const wrapper = shallowMount(UnifiedServicesView, {
    global: {
      plugins: [router],
    },
  })

  return { router, wrapper }
}

describe('UnifiedServicesView', () => {
  it('uses navigation mode by default', async () => {
    const { wrapper } = await mountUnified()
    const tabs = wrapper.findAll('[role="tab"]')

    expect(tabs).toHaveLength(2)
    expect(tabs[0]?.attributes('aria-selected')).toBe('true')
    expect(tabs[1]?.attributes('aria-selected')).toBe('false')
    expect(wrapper.find('home-view-stub').exists()).toBe(true)
  })

  it('switches to management mode through the route query', async () => {
    const { router, wrapper } = await mountUnified('/services?mode=manage')
    const tabs = wrapper.findAll('[role="tab"]')

    expect(router.currentRoute.value.query.mode).toBe('manage')
    expect(tabs[0]?.attributes('aria-selected')).toBe('false')
    expect(tabs[1]?.attributes('aria-selected')).toBe('true')
    expect(wrapper.find('async-component-wrapper-stub').exists()).toBe(true)
  })
})
