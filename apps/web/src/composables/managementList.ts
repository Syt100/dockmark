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
  load: () => Promise<void>
  applySavedFlash: (value: unknown) => boolean
  remove: (id: string) => Promise<void>
}

export function isSavedMarker(value: unknown): value is keyof SavedFlashMessages {
  return value === 'created' || value === 'updated'
}

export function useManagementList<T>(options: {
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

  async function load() {
    isLoading.value = true
    error.value = null

    try {
      records.value = await options.loadRecords()
    } catch (caught) {
      error.value = toChineseError(caught, options.loadErrorMessage)
    } finally {
      isLoading.value = false
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
    load,
    applySavedFlash,
    remove,
  }
}
