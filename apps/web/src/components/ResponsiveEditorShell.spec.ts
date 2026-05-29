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
      { path: '/services/new', component: ResponsiveEditorShell, props: { title: '新建服务', backTo: '/services' } },
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

  it('locks body scroll and closes the desktop dialog with Escape', async () => {
    const router = createTestRouter()
    await router.isReady()

    mount(ResponsiveEditorShell, {
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

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await nextTick()
    await new Promise((resolve) => window.setTimeout(resolve, 0))

    expect(router.currentRoute.value.path).toBe('/services')
  })
})
