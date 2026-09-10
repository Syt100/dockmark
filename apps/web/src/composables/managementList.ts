import { ref, type Ref } from 'vue'

import { toChineseError } from '../api/errors'

export type SavedFlashMessages = {
  created: string
  updated: string
}

export type ManagementListState<T> = {
  records: Ref<T[]>
  error: Ref<string | null>
  feedback: Ref<string | null>
  isLoading: Ref<boolean>
  isRefreshing: Ref<boolean>
  load: () => Promise<void>
  applySavedFlash: (value: unknown) => boolean
  remove: (id: string) => Promise<void>
}

export function isSavedMarker(value: unknown): value is keyof SavedFlashMessages {
  return value === 'created' || value === 'updated'
}

export function useManagementList<T extends { id: string }>(options: {
  loadRecords: () => Promise<T[]>
  deleteRecord: (id: string) => Promise<void>
  loadErrorMessage: string
  deleteErrorMessage: string
  deleteSuccessMessage: string
  savedMessages: SavedFlashMessages
}): ManagementListState<T> {
  const records = ref<T[]>([]) as Ref<T[]>
  const error = ref<string | null>(null)
  const feedback = ref<string | null>(null)
  const isLoading = ref(false)
  const isRefreshing = ref(false)
  const hasLoaded = ref(false)
  let latestLoadId = 0

  async function load() {
    const loadId = ++latestLoadId

    if (hasLoaded.value) {
      isRefreshing.value = true
    } else {
      isLoading.value = true
    }
    error.value = null

    try {
      const nextRecords = await options.loadRecords()

      if (loadId !== latestLoadId) {
        return
      }

      records.value = nextRecords
      hasLoaded.value = true
    } catch (caught) {
      if (loadId !== latestLoadId) {
        return
      }

      error.value = toChineseError(caught, options.loadErrorMessage)
    } finally {
      if (loadId === latestLoadId) {
        isLoading.value = false
        isRefreshing.value = false
      }
    }
  }

  function applySavedFlash(value: unknown): boolean {
    if (!isSavedMarker(value)) {
      return false
    }

    feedback.value = options.savedMessages[value]
    return true
  }

  async function remove(id: string) {
    error.value = null
    feedback.value = null

    try {
      await options.deleteRecord(id)
      records.value = records.value.filter((record) => record.id !== id)
      feedback.value = options.deleteSuccessMessage
      await load()
    } catch (caught) {
      error.value = toChineseError(caught, options.deleteErrorMessage)
    }
  }

  return {
    records,
    error,
    feedback,
    isLoading,
    isRefreshing,
    load,
    applySavedFlash,
    remove,
  }
}
