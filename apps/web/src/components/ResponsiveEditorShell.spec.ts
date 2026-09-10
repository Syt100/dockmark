import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import ResponsiveEditorShell from './ResponsiveEditorShell.vue'

function createTestRouter() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/services', component: { template: '<div>services</div>' } },
      {
        path: '/services/new',
        component: ResponsiveEditorShell,
        props: { title: '新建服务', backTo: '/services' },
      },
    ],
  })

  router.push('/services/new')
  return router
}

describe('ResponsiveEditorShell', () => {
  const originalMatchMedia = window.matchMedia

  beforeEach(() => {
    window.matchMedia = vi.fn<typeof window.matchMedia>().mockReturnValue({
      matches: true,
      media: '(min-width: 768px)',
      addEventListener: vi.fn<MediaQueryList['addEventListener']>(),
      removeEventListener: vi.fn<MediaQueryList['removeEventListener']>(),
    } as unknown as MediaQueryList)
  })

  afterEach(() => {
    window.matchMedia = originalMatchMedia
    document.body.style.overflow = ''
  })

  it('closes the desktop dialog through its leave state before returning to the parent route', async () => {
    const router = createTestRouter()
    await router.isReady()

    const wrapper = mount(ResponsiveEditorShell, {
      props: {
        title: '新建服务',
        backTo: '/services',
      },
      global: {
        plugins: [router],
      },
      slots: {
        default: '<button>保存</button>',
      },
    })

    expect(document.body.style.overflow).toBe('hidden')
    expect(wrapper.find('[role="dialog"]').exists()).toBe(true)

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await nextTick()

    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)

    await new Promise((resolve) => window.setTimeout(resolve, 300))
    expect(router.currentRoute.value.path).toBe('/services')
  })

  it('keeps the animated dialog separate from the full-screen centering layer', async () => {
    const router = createTestRouter()
    await router.isReady()

    const wrapper = mount(ResponsiveEditorShell, {
      props: {
        title: '新建服务',
        backTo: '/services',
      },
      global: {
        plugins: [router],
      },
      slots: {
        default: '<button>保存</button>',
      },
    })

    const centeringLayer = wrapper.get('.pointer-events-none')
    const dialog = wrapper.get('[role="dialog"]')

    expect(centeringLayer.element.contains(dialog.element)).toBe(true)
    expect(centeringLayer.classes()).toContain('fixed')
    expect(dialog.classes()).toContain('pointer-events-auto')
  })
})
