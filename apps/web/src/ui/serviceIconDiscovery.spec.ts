import { afterEach, describe, expect, it, vi } from 'vitest'

import { automaticIconLimits } from '@dockmark/shared'

import { discoverIconInBrowser } from './serviceIconDiscovery'

class ProbeImage {
  onload: (() => void) | null = null
  onerror: (() => void) | null = null
  referrerPolicy = ''
  naturalWidth = 0
  naturalHeight = 0

  set src(value: string) {
    queueMicrotask(() => {
      if (value.endsWith('/declared.png')) {
        this.naturalWidth = 64
        this.naturalHeight = 64
        this.onload?.()
      } else {
        this.onerror?.()
      }
    })
  }
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('browser service icon discovery', () => {
  it('can offer a declared icon as an external candidate when CORS blocks its bytes', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockImplementation((input) => {
      const url = String(input)

      if (url === 'https://example.test/app') {
        return Promise.resolve(
          new Response('<link rel="icon" href="/declared.png" sizes="64x64">', {
            status: 200,
            headers: { 'content-type': 'text/html' },
          }),
        )
      }

      return Promise.reject(new TypeError('CORS blocked'))
    })

    vi.stubGlobal('fetch', fetchMock)
    vi.stubGlobal('Image', ProbeImage as unknown as typeof Image)

    await expect(discoverIconInBrowser('https://example.test/app')).resolves.toEqual({
      kind: 'external',
      sourceUrl: 'https://example.test/declared.png',
      width: 64,
      height: 64,
    })
  })

  it('does not consume an oversized HTML body when Content-Length already exceeds the limit', async () => {
    let bodyRead = false
    const stream = new ReadableStream<Uint8Array>({
      pull(controller) {
        bodyRead = true
        controller.enqueue(new TextEncoder().encode('<link rel="icon" href="/declared.png">'))
        controller.close()
      },
    })
    const fetchMock = vi.fn<typeof fetch>().mockImplementation((input) => {
      if (String(input) === 'https://example.test/app') {
        return Promise.resolve(
          new Response(stream, {
            status: 200,
            headers: {
              'content-type': 'text/html',
              'content-length': String(automaticIconLimits.maxHtmlBytes + 1),
            },
          }),
        )
      }

      return Promise.reject(new TypeError('CORS blocked'))
    })

    class FailingImage extends ProbeImage {
      override set src(_value: string) {
        queueMicrotask(() => this.onerror?.())
      }
    }

    vi.stubGlobal('fetch', fetchMock)
    vi.stubGlobal('Image', FailingImage as unknown as typeof Image)

    await expect(discoverIconInBrowser('https://example.test/app')).rejects.toThrow(
      '浏览器没有找到可用的网站图标',
    )
    expect(bodyRead).toBe(false)
  })
})
