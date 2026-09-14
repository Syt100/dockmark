import { describe, expect, it } from 'vitest'

import {
  automaticIconLimits,
  managedIconKey,
  parseManagedIconKey,
  rankIconCandidates,
  validateIconFetchRequest,
} from './service-icons'

describe('automatic service icon contracts', () => {
  it('ranks explicit and higher-quality candidates deterministically', () => {
    const ranked = rankIconCandidates([
      { url: 'https://example.test/favicon.ico', source: 'conventional' },
      {
        url: 'https://example.test/icon-64.png',
        source: 'html-icon',
        mimeType: 'image/png',
        size: 64,
      },
      {
        url: 'https://example.test/icon.svg',
        source: 'html-icon',
        mimeType: 'image/svg+xml',
      },
      {
        url: 'https://example.test/icon-192.png',
        source: 'manifest',
        mimeType: 'image/png',
        size: 192,
      },
    ])

    expect(ranked.map((candidate) => candidate.url)).toEqual([
      'https://example.test/icon.svg',
      'https://example.test/icon-64.png',
      'https://example.test/icon-192.png',
      'https://example.test/favicon.ico',
    ])
  })

  it('deduplicates and bounds candidates', () => {
    const ranked = rankIconCandidates(
      Array.from({ length: automaticIconLimits.maxCandidates + 4 }, (_, index) => ({
        url: `https://example.test/${index}.png`,
        source: 'conventional' as const,
      })),
    )

    expect(ranked).toHaveLength(automaticIconLimits.maxCandidates)
  })

  it('builds and parses managed icon keys', () => {
    const hash = 'a'.repeat(64)
    const key = managedIconKey(hash, 'image/png')

    expect(key).toBe(`icons/sha256/${hash}.png`)
    expect(parseManagedIconKey(key)).toEqual({ hash, extension: 'png' })
    expect(parseManagedIconKey('icons/not-managed.png')).toBeNull()
  })

  it('accepts only valid http and https fetch requests', () => {
    expect(validateIconFetchRequest({ url: ' https://example.test/app ' })).toEqual({
      ok: true,
      value: { url: 'https://example.test/app' },
    })
    expect(validateIconFetchRequest({ url: 'file:///etc/passwd' })).toEqual({
      ok: false,
      errors: ['url must use http or https'],
    })
  })
})
