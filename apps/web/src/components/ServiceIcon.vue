<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import type { IconType } from '@dockmark/shared'

const props = withDefaults(
  defineProps<{
    name: string
    icon: string | null
    iconType: IconType
    primaryUrl?: string | null
    size?: 'sm' | 'md' | 'lg'
  }>(),
  {
    primaryUrl: null,
    size: 'md',
  },
)

const hasImageError = ref(false)

const rootClasses = computed(() => [
  'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-[var(--dm-radius-control)] bg-[var(--dm-surface-muted)] font-semibold text-[var(--dm-text-muted)] ring-1 ring-inset ring-[var(--dm-border)]',
  props.size === 'sm'
    ? 'h-8 w-8 text-xs'
    : props.size === 'lg'
      ? 'h-12 w-12 text-lg'
      : 'h-9 w-9 text-base',
])

const imageClasses = computed(() => [
  'h-full w-full object-contain',
  props.size === 'sm' ? 'p-1' : 'p-1.5',
])

const trimmedIcon = computed(() => props.icon?.trim() ?? '')

const faviconUrl = computed(() => {
  if (!props.primaryUrl) {
    return null
  }

  try {
    return `${new URL(props.primaryUrl).origin}/favicon.ico`
  } catch {
    return null
  }
})

const imageUrl = computed(() => {
  if (props.iconType === 'url') {
    return trimmedIcon.value || null
  }

  if (props.iconType === 'favicon') {
    return faviconUrl.value
  }

  return null
})

const shouldRenderImage = computed(() => imageUrl.value !== null && !hasImageError.value)

const fallbackText = computed(() => {
  const normalizedName = props.name.trim()

  if (!normalizedName) {
    return '?'
  }

  const words = normalizedName.split(/[\s._-]+/).filter(Boolean)
  const initials =
    words.length > 1 ? `${words[0]?.[0] ?? ''}${words[1]?.[0] ?? ''}` : normalizedName.slice(0, 2)

  return initials.toUpperCase()
})

const textIcon = computed(() => {
  if (props.iconType !== 'emoji') {
    return fallbackText.value
  }

  return trimmedIcon.value || fallbackText.value
})

watch(
  () => [props.iconType, props.icon, props.primaryUrl],
  () => {
    hasImageError.value = false
  },
)
</script>

<template>
  <span :class="rootClasses" aria-hidden="true">
    <img
      v-if="shouldRenderImage"
      :alt="`${name} 图标`"
      :class="imageClasses"
      :src="imageUrl ?? undefined"
      @error="hasImageError = true"
    />
    <span v-else class="max-w-full truncate px-1 leading-none">{{ textIcon }}</span>
  </span>
</template>
