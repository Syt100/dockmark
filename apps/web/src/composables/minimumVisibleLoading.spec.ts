import { nextTick, ref } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useMinimumVisibleLoading } from './minimumVisibleLoading'

describe('useMinimumVisibleLoading', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('keeps a quick loading state visible for the minimum duration', async () => {
    const source = ref(false)
    const visible = useMinimumVisibleLoading(source, 200)

    source.value = true
    await nextTick()

    expect(visible.value).toBe(true)

    vi.advanceTimersByTime(40)
    source.value = false
    await nextTick()

    expect(visible.value).toBe(true)

    vi.advanceTimersByTime(159)
    expect(visible.value).toBe(true)

    vi.advanceTimersByTime(1)
    expect(visible.value).toBe(false)
  })

  it('hides immediately after a loading state outlives the minimum duration', async () => {
    const source = ref(false)
    const visible = useMinimumVisibleLoading(source, 200)

    source.value = true
    await nextTick()
    vi.advanceTimersByTime(220)

    source.value = false
    await nextTick()

    expect(visible.value).toBe(false)
  })
})
