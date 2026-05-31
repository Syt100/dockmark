import { onBeforeUnmount, ref, watch, type Ref } from 'vue'

export function useMinimumVisibleLoading(source: Ref<boolean>, durationMs = 200) {
  const visible = ref(source.value)
  let loadingStartedAt = source.value ? Date.now() : 0
  let hideTimer: ReturnType<typeof window.setTimeout> | null = null

  function clearHideTimer() {
    if (hideTimer === null) {
      return
    }

    window.clearTimeout(hideTimer)
    hideTimer = null
  }

  watch(
    source,
    (isLoading) => {
      clearHideTimer()

      if (isLoading) {
        loadingStartedAt = Date.now()
        visible.value = true
        return
      }

      if (!visible.value) {
        return
      }

      const remaining = Math.max(durationMs - (Date.now() - loadingStartedAt), 0)

      if (remaining === 0) {
        visible.value = false
        return
      }

      hideTimer = window.setTimeout(() => {
        visible.value = false
        hideTimer = null
      }, remaining)
    },
    { immediate: true },
  )

  onBeforeUnmount(clearHideTimer)

  return visible
}
