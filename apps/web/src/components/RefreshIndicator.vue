<script setup lang="ts">
withDefaults(
  defineProps<{
    active: boolean
    label?: string
  }>(),
  {
    label: '正在刷新…',
  },
)
</script>

<template>
  <span
    class="items-center justify-end gap-1.5 text-xs text-[var(--dm-text-subtle)] transition-opacity"
    :class="
      active
        ? 'inline-flex min-w-[5rem] opacity-100'
        : 'hidden opacity-0 sm:inline-flex sm:min-w-[5rem]'
    "
    :aria-hidden="!active"
    aria-live="polite"
  >
    <span
      class="h-1.5 w-1.5 rounded-full bg-[var(--dm-primary)]"
      :class="active && 'animate-pulse'"
      aria-hidden="true"
    ></span>
    {{ label }}
  </span>
</template>
