import { describe, expect, it, vi } from 'vitest'

import { useManagementList } from './managementList'

type TestRecord = { id: string; name: string }

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((nextResolve, nextReject) => {
    resolve = nextResolve
    reject = nextReject
  })

  return { promise, resolve, reject }
}

const messages = {
  loadErrorMessage: '加载失败',
  deleteErrorMessage: '删除失败',
  deleteSuccessMessage: '已删除',
  savedMessages: {
    created: '已创建',
    updated: '已保存',
  },
}

describe('useManagementList', () => {
  it('uses the blocking loading state only for the initial load', async () => {
    const firstLoad = deferred<TestRecord[]>()
    const loadRecords = vi.fn<() => Promise<TestRecord[]>>(() => firstLoad.promise)
    const state = useManagementList({
      loadRecords,
      deleteRecord: vi.fn<(id: string) => Promise<void>>(async () => undefined),
      ...messages,
    })

    const loading = state.load()
    expect(state.isLoading.value).toBe(true)
    expect(state.isRefreshing.value).toBe(false)

    firstLoad.resolve([{ id: 'a', name: 'A' }])
    await loading

    expect(state.records.value).toEqual([{ id: 'a', name: 'A' }])
    expect(state.isLoading.value).toBe(false)
  })

  it('keeps existing records visible while a later refresh is pending', async () => {
    const refresh = deferred<TestRecord[]>()
    const loadRecords = vi
      .fn<() => Promise<TestRecord[]>>()
      .mockResolvedValueOnce([{ id: 'a', name: 'A' }])
      .mockImplementationOnce(() => refresh.promise)
    const state = useManagementList({
      loadRecords,
      deleteRecord: vi.fn<(id: string) => Promise<void>>(async () => undefined),
      ...messages,
    })

    await state.load()
    const refreshing = state.load()

    expect(state.isLoading.value).toBe(false)
    expect(state.isRefreshing.value).toBe(true)
    expect(state.records.value).toEqual([{ id: 'a', name: 'A' }])

    refresh.resolve([{ id: 'a', name: 'A2' }])
    await refreshing

    expect(state.records.value).toEqual([{ id: 'a', name: 'A2' }])
    expect(state.isRefreshing.value).toBe(false)
  })

  it('keeps the newest refresh result when requests resolve out of order', async () => {
    const olderRefresh = deferred<TestRecord[]>()
    const newerRefresh = deferred<TestRecord[]>()
    const loadRecords = vi
      .fn<() => Promise<TestRecord[]>>()
      .mockResolvedValueOnce([{ id: 'a', name: 'Initial' }])
      .mockImplementationOnce(() => olderRefresh.promise)
      .mockImplementationOnce(() => newerRefresh.promise)
    const state = useManagementList({
      loadRecords,
      deleteRecord: vi.fn<(id: string) => Promise<void>>(async () => undefined),
      ...messages,
    })

    await state.load()
    const older = state.load()
    const newer = state.load()

    newerRefresh.resolve([{ id: 'a', name: 'Newest' }])
    await newer

    expect(state.records.value).toEqual([{ id: 'a', name: 'Newest' }])
    expect(state.isRefreshing.value).toBe(false)

    olderRefresh.resolve([{ id: 'a', name: 'Stale' }])
    await older

    expect(state.records.value).toEqual([{ id: 'a', name: 'Newest' }])
    expect(state.isRefreshing.value).toBe(false)
  })

  it('removes a deleted record locally before the follow-up refresh completes', async () => {
    const refresh = deferred<TestRecord[]>()
    const loadRecords = vi
      .fn<() => Promise<TestRecord[]>>()
      .mockResolvedValueOnce([
        { id: 'a', name: 'A' },
        { id: 'b', name: 'B' },
      ])
      .mockImplementationOnce(() => refresh.promise)
    const deleteRecord = vi.fn<(id: string) => Promise<void>>(async () => undefined)
    const state = useManagementList({ loadRecords, deleteRecord, ...messages })

    await state.load()
    const removing = state.remove('a')
    await Promise.resolve()

    expect(deleteRecord).toHaveBeenCalledWith('a')
    expect(state.records.value).toEqual([{ id: 'b', name: 'B' }])
    expect(state.isRefreshing.value).toBe(true)

    refresh.resolve([{ id: 'b', name: 'B' }])
    await removing
  })
})
