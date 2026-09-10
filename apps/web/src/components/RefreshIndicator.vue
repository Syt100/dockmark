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
    class="inline-flex min-w-[5rem] items-center justify-end gap-1.5 text-xs text-[var(--dm-text-subtle)] transition-opacity"
    :class="active ? 'opacity-100' : 'opacity-0'"
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
