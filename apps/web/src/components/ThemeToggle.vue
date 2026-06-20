<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import AppIconButton from './AppIconButton.vue'

type ThemeMode = 'light' | 'dark'

const themeStorageKey = 'dockmark-theme'

function readStoredTheme(): ThemeMode {
  const storedTheme = localStorage.getItem(themeStorageKey)
  if (storedTheme === 'dark' || storedTheme === 'light') {
    return storedTheme
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

const mode = ref<ThemeMode>(readStoredTheme())
const isDark = computed(() => mode.value === 'dark')
const label = computed(() => (isDark.value ? '切换到浅色模式' : '切换到深色模式'))

watch(
  mode,
  (nextMode) => {
    document.documentElement.classList.toggle('dark', nextMode === 'dark')
    localStorage.setItem(themeStorageKey, nextMode)
  },
  { immediate: true },
)

function toggleTheme() {
  mode.value = isDark.value ? 'light' : 'dark'
}
</script>

<template>
  <AppIconButton :label="label" @click="toggleTheme">
    <svg
      v-if="isDark"
      aria-hidden="true"
      class="h-5 w-5"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      viewBox="0 0 24 24"
    >
      <path
        d="M12 4V2m0 20v-2m5.66-13.66 1.41-1.41M4.93 19.07l1.41-1.41M20 12h2M2 12h2m13.66 5.66 1.41 1.41M4.93 4.93l1.41 1.41"
        stroke-linecap="round"
      />
      <circle cx="12" cy="12" r="4" />
    </svg>
    <svg
      v-else
      aria-hidden="true"
      class="h-5 w-5"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      viewBox="0 0 24 24"
    >
      <path d="M20.5 14.5A7.5 7.5 0 0 1 9.5 3.5 8.5 8.5 0 1 0 20.5 14.5Z" stroke-linejoin="round" />
    </svg>
  </AppIconButton>
</template>
