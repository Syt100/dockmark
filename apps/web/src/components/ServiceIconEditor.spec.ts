import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { discoverIconInBrowser } from '../ui/serviceIconDiscovery'
import ServiceIconEditor from './ServiceIconEditor.vue'

vi.mock('../ui/serviceIconDiscovery', () => ({
  discoverIconInBrowser: vi.fn(),
}))

const endpoints = [
  {
    label: '公网',
    url: 'https://example.test/app',
    isPrimary: true,
  },
  {
    label: '内网',
    url: 'http://192.168.1.5:8080',
    isPrimary: false,
  },
]

function buttonByText(wrapper: ReturnType<typeof mount>, text: string) {
  const button = wrapper.findAll('button').find((item) => item.text().includes(text))
  if (!button) throw new Error(`button not found: ${text}`)
  return button
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

describe('ServiceIconEditor', () => {
  it('defaults automatic discovery to the primary endpoint', () => {
    const wrapper = mount(ServiceIconEditor, {
      props: {
        name: 'Grafana',
        icon: '',
        iconType: 'emoji',
        endpoints,
      },
    })

    expect(wrapper.get('select[name="service-icon-source"]').element).toHaveProperty(
      'value',
      'https://example.test/app',
    )
  })

  it('previews a server result without changing the form until accepted', async () => {
    const key = `icons/sha256/${'a'.repeat(64)}.png`
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          kind: 'managed',
          iconType: 'r2',
          icon: key,
          assetUrl: `/api/icon-assets/${key}`,
          sourceUrl: 'https://example.test/icon.png',
          mimeType: 'image/png',
          byteLength: 128,
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      ),
    )
    vi.stubGlobal('fetch', fetchMock)

    const wrapper = mount(ServiceIconEditor, {
      props: {
        name: 'Grafana',
        icon: '📊',
        iconType: 'emoji',
        endpoints,
      },
    })

    await buttonByText(wrapper, '服务端获取').trigger('click')
    await flushPromises()

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/icons/fetch',
      expect.objectContaining({ method: 'POST' }),
    )
    expect(wrapper.find('[data-icon-candidate]').exists()).toBe(true)
    expect(wrapper.emitted('update:icon')).toBeUndefined()
    expect(wrapper.emitted('update:iconType')).toBeUndefined()

    await buttonByText(wrapper, '使用此图标').trigger('click')

    expect(wrapper.emitted('update:iconType')?.at(-1)).toEqual(['r2'])
    expect(wrapper.emitted('update:icon')?.at(-1)).toEqual([key])
  })

  it('keeps the existing icon when server discovery fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>().mockResolvedValue(
        new Response(
          JSON.stringify({
            error: { code: 'validation_failed', message: '没有找到可用的网站图标' },
          }),
          { status: 400, headers: { 'content-type': 'application/json' } },
        ),
      ),
    )

    const wrapper = mount(ServiceIconEditor, {
      props: {
        name: 'Grafana',
        icon: '📊',
        iconType: 'emoji',
        endpoints,
      },
    })

    await buttonByText(wrapper, '服务端获取').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('没有找到可用的网站图标')
    expect(wrapper.emitted('update:icon')).toBeUndefined()
    expect(wrapper.emitted('update:iconType')).toBeUndefined()
  })

  it('uses browser discovery without silently calling server discovery', async () => {
    vi.mocked(discoverIconInBrowser).mockResolvedValue({
      kind: 'external',
      sourceUrl: 'https://example.test/favicon.ico',
      width: 32,
      height: 32,
    })
    const fetchMock = vi.fn<typeof fetch>()
    vi.stubGlobal('fetch', fetchMock)

    const wrapper = mount(ServiceIconEditor, {
      props: {
        name: 'Grafana',
        icon: '',
        iconType: 'favicon',
        endpoints,
      },
    })

    await buttonByText(wrapper, '浏览器获取').trigger('click')
    await flushPromises()

    expect(discoverIconInBrowser).toHaveBeenCalledWith('https://example.test/app')
    expect(fetchMock).not.toHaveBeenCalled()
    expect(wrapper.find('[data-icon-candidate]').exists()).toBe(true)

    await buttonByText(wrapper, '使用此图标').trigger('click')
    expect(wrapper.emitted('update:iconType')?.at(-1)).toEqual(['url'])
    expect(wrapper.emitted('update:icon')?.at(-1)).toEqual(['https://example.test/favicon.ico'])
  })

  it('uploads browser-readable icon bytes before previewing a managed candidate', async () => {
    const key = `icons/sha256/${'b'.repeat(64)}.png`
    vi.mocked(discoverIconInBrowser).mockResolvedValue({
      kind: 'blob',
      blob: new Blob([new Uint8Array([0x89, 0x50, 0x4e, 0x47])], { type: 'image/png' }),
      sourceUrl: 'https://example.test/icon.png',
    })
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          kind: 'managed',
          iconType: 'r2',
          icon: key,
          assetUrl: `/api/icon-assets/${key}`,
          sourceUrl: 'https://example.test/icon.png',
          mimeType: 'image/png',
          byteLength: 4,
        }),
        { status: 201, headers: { 'content-type': 'application/json' } },
      ),
    )
    vi.stubGlobal('fetch', fetchMock)

    const wrapper = mount(ServiceIconEditor, {
      props: {
        name: 'Grafana',
        icon: '',
        iconType: 'emoji',
        endpoints,
      },
    })

    await buttonByText(wrapper, '浏览器获取').trigger('click')
    await flushPromises()

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/icons/upload')
    const init = fetchMock.mock.calls[0]?.[1]
    expect(init?.method).toBe('POST')
    expect(init?.body).toBeInstanceOf(FormData)
    expect(wrapper.find('[data-icon-candidate]').exists()).toBe(true)
  })
})
