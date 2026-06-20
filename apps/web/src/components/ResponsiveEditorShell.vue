<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'

import AppIconButton from './AppIconButton.vue'

const props = defineProps<{
  title: string
  backTo: string
}>()

const router = useRouter()
const dialog = ref<HTMLElement | null>(null)
const previouslyFocused = ref<Element | null>(null)

let mediaQuery: MediaQueryList | null = null
let originalBodyOverflow = ''
let isBodyLocked = false

function close() {
  void router.push(props.backTo)
}

function getDesktopMediaQuery() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return null
  }

  return window.matchMedia('(min-width: 768px)')
}

function isDesktopEditor() {
  if (typeof window === 'undefined') {
    return false
  }

  return getDesktopMediaQuery()?.matches ?? window.innerWidth >= 768
}

function lockBodyScroll() {
  if (typeof document === 'undefined' || isBodyLocked || !isDesktopEditor()) {
    return
  }

  originalBodyOverflow = document.body.style.overflow
  document.body.style.overflow = 'hidden'
  isBodyLocked = true
}

function unlockBodyScroll() {
  if (typeof document === 'undefined' || !isBodyLocked) {
    return
  }

  document.body.style.overflow = originalBodyOverflow
  isBodyLocked = false
}

function syncBodyScrollLock() {
  if (isDesktopEditor()) {
    lockBodyScroll()
  } else {
    unlockBodyScroll()
  }
}

function focusDialog() {
  const focusable = dialog.value?.querySelector<HTMLElement>(
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
  )

  ;(focusable ?? dialog.value)?.focus()
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && isDesktopEditor()) {
    event.preventDefault()
    close()
  }
}

onMounted(async () => {
  previouslyFocused.value = document.activeElement
  mediaQuery = getDesktopMediaQuery()
  mediaQuery?.addEventListener('change', syncBodyScrollLock)
  document.addEventListener('keydown', handleKeydown)
  syncBodyScrollLock()

  await nextTick()
  focusDialog()
})

onBeforeUnmount(() => {
  mediaQuery?.removeEventListener('change', syncBodyScrollLock)
  document.removeEventListener('keydown', handleKeydown)
  unlockBodyScroll()

  if (previouslyFocused.value instanceof HTMLElement) {
    previouslyFocused.value.focus()
  }
})
</script>

<template>
  <div>
    <div class="md:hidden">
      <div class="mb-4 flex items-center justify-between gap-3">
        <RouterLink
          class="text-sm font-medium text-[var(--dm-text-muted)] hover:text-[var(--dm-text)]"
          :to="backTo"
          >返回</RouterLink
        >
        <h1 class="text-lg font-semibold text-[var(--dm-text)]">{{ title }}</h1>
        <span class="w-8" aria-hidden="true"></span>
      </div>
      <slot />
    </div>

    <div class="hidden md:block">
      <Transition appear name="dm-fade">
        <button
          class="fixed inset-0 z-30 cursor-default bg-[var(--dm-overlay)]"
          type="button"
          aria-label="关闭编辑器"
          @click="close"
        ></button>
      </Transition>
      <div class="fixed inset-0 z-40 grid place-items-center p-6 pointer-events-none">
        <Transition appear name="dm-panel">
          <section
            ref="dialog"
            class="pointer-events-auto max-h-[calc(100dvh-4rem)] w-[min(760px,calc(100vw-3rem))] overflow-auto rounded-[var(--dm-radius-surface)] bg-[var(--dm-surface-elevated)] shadow-[var(--dm-shadow-elevated)]"
            role="dialog"
            aria-modal="true"
            :aria-label="title"
            tabindex="-1"
          >
            <div
              class="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--dm-border)] bg-[var(--dm-surface-elevated)] px-5 py-4"
            >
              <h1 class="text-lg font-semibold text-[var(--dm-text)]">{{ title }}</h1>
              <AppIconButton label="关闭" type="button" @click="close">
                <svg
                  aria-hidden="true"
                  class="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.8"
                  viewBox="0 0 24 24"
                >
                  <path d="m6 6 12 12M18 6 6 18" stroke-linecap="round" />
                </svg>
              </AppIconButton>
            </div>
            <div class="p-5">
              <slot />
            </div>
          </section>
        </Transition>
      </div>
    </div>
  </div>
</template>
