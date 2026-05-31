import { describe, expect, it } from 'vitest'

import { formatBuildTime } from './buildInfo'

describe('buildInfo', () => {
  it('formats build time in the provided local timezone', () => {
    expect(
      formatBuildTime('2026-05-31T08:15:30.000Z', 'en-US', {
      timeZone: 'Asia/Shanghai',
      }),
    ).toBe('05/31/2026, 04:15:30 PM GMT+8')
  })

  it('returns unknown for invalid build time', () => {
    expect(formatBuildTime('not-a-date')).toBe('unknown')
  })
})
