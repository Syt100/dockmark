import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  assertSafeExternalUrl,
  discoverHtmlCandidates,
  discoverManifestCandidates,
  fetchSafeExternal,
  storeManagedIcon,
} from '../src/services/service-icons'

const pngBytes = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x00,
])

function createR2Mock() {
  const objects = new Map<string, Uint8Array>()
  const put = vi.fn(async (key: string, value: ReadableStream | ArrayBuffer | ArrayBufferView | string | null) => {
    if (value instanceof Uint8Array) {
      objects.set(key, value)
    } else if (ArrayBuffer.isView(value)) {
      objects.set(key, new Uint8Array(value.buffer, value.byteOffset, value.byteLength))
    } else if (value instanceof ArrayBuffer) {
      objects.set(key, new Uint8Array(value))
    } else {
      throw new Error('unexpected test value')
    }
    return {} as R2Object
  })

  return {
    objects,
    put,
    bucket: {
      head: (key: string) => Promise.resolve(objects.has(key) ? ({} as R2Object) : null),
      put,
    } as unknown as R2Bucket,
  }
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('service icon Worker boundary', () => {
  it.each([
    'http://127.0.0.1:8080',
    'http://10.0.0.4',
    'http://172.16.1.2',
    'http://192.168.1.10',
    'http://100.64.1.2',
    'http://[::1]',
    'http://grafana.local',
    'http://nas.home.arpa',
  ])('rejects server-side private target %s', (target) => {
    expect(() => assertSafeExternalUrl(target)).toThrow('本地或私有网络地址')
  })

  it('rejects embedded credentials but accepts public HTTP(S)', () => {
    expect(() => assertSafeExternalUrl('https://user:pass@example.com')).toThrow('用户名或密码')
    expect(assertSafeExternalUrl('https://example.com/app').hostname).toBe('example.com')
  })

  it('revalidates redirect destinations before following them', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(null, {
        status: 302,
        headers: { location: 'http://127.0.0.1/admin' },
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    await expect(fetchSafeExternal('https://example.com')).rejects.toThrow('本地或私有网络地址')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('discovers declared HTML and manifest icons relative to their documents', () => {
    const html = `
      <link rel="icon" href="./assets/icon-64.png" sizes="64x64" type="image/png">
      <link rel="apple-touch-icon" href="/touch.png" sizes="180x180">
      <link rel="manifest" href="/manifest.webmanifest">
    `
    const discovered = discoverHtmlCandidates(html, new URL('https://example.com/app/index.html'))

    expect(discovered.candidates).toEqual([
      {
        url: 'https://example.com/app/assets/icon-64.png',
        source: 'html-icon',
        mimeType: 'image/png',
        size: 64,
      },
      {
        url: 'https://example.com/touch.png',
        source: 'apple-touch-icon',
        mimeType: undefined,
        size: 180,
      },
    ])
    expect(discovered.manifestUrls).toEqual(['https://example.com/manifest.webmanifest'])

    expect(
      discoverManifestCandidates(
        { icons: [{ src: 'icons/192.png', sizes: '192x192', type: 'image/png' }] },
        new URL('https://example.com/manifest.webmanifest'),
      ),
    ).toEqual([
      {
        url: 'https://example.com/icons/192.png',
        source: 'manifest',
        mimeType: 'image/png',
        size: 192,
      },
    ])
  })

  it('stores accepted bytes under a SHA-256 content-addressed key and deduplicates', async () => {
    const { bucket, objects, put } = createR2Mock()

    const first = await storeManagedIcon(bucket, pngBytes, 'https://example.com/icon.png')
    const second = await storeManagedIcon(bucket, pngBytes, 'https://example.com/icon.png')

    expect(first.icon).toMatch(/^icons\/sha256\/[a-f0-9]{64}\.png$/)
    expect(first).toEqual(second)
    expect(objects.get(first.icon)).toEqual(pngBytes)
    expect(put).toHaveBeenCalledTimes(1)
  })

  it('rejects SVG and arbitrary bytes from same-origin managed storage', async () => {
    const { bucket } = createR2Mock()
    const svg = new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"></svg>')

    await expect(storeManagedIcon(bucket, svg, 'https://example.com/icon.svg')).rejects.toThrow(
      '仅支持 PNG、JPEG、WebP、GIF 或 ICO',
    )
  })
})
