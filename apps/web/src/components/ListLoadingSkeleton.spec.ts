import { mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { describe, expect, it } from 'vitest'

import ListLoadingSkeleton from './ListLoadingSkeleton.vue'

async function mountAt(path: string) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/services', component: { template: '<div />' } }],
  })

  await router.push(path)
  await router.isReady()

  return mount(ListLoadingSkeleton, {
    props: { label: '正在加载服务...' },
    global: { plugins: [router] },
  })
}

describe('ListLoadingSkeleton', () => {
  it('matches the default service card view', async () => {
    const wrapper = await mountAt('/services')

    expect(wrapper.find('[data-loading-layout="cards"]').exists()).toBe(true)
    expect(wrapper.find('[data-loading-layout="list"]').exists()).toBe(false)
  })

  it('matches the service list view', async () => {
    const wrapper = await mountAt('/services?view=list')

    expect(wrapper.find('[data-loading-layout="cards"]').exists()).toBe(false)
    expect(wrapper.findAll('[data-loading-layout="list"]')).toHaveLength(2)
  })
})
