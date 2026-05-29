<script setup lang="ts">
withDefaults(
  defineProps<{
    tone?: 'neutral' | 'primary' | 'success' | 'warning' | 'danger'
  }>(),
  {
    tone: 'neutral',
  },
)
</script>

<template>
  <span
    :class="[
      'inline-flex items-center rounded-[var(--dm-radius-chip)] px-2 py-1 text-xs font-medium',
      tone === 'neutral' && 'bg-[var(--dm-surface-muted)] text-[var(--dm-text-muted)]',
      tone === 'primary' && 'bg-[var(--dm-primary-soft)] text-[var(--dm-primary)]',
      tone === 'success' && 'bg-[var(--dm-success-soft)] text-[var(--dm-success-text)]',
      tone === 'warning' && 'bg-[var(--dm-warning-soft)] text-[var(--dm-warning-text)]',
      tone === 'danger' && 'bg-[var(--dm-danger-soft)] text-[var(--dm-danger)]',
    ]"
  >
    <slot />
  </span>
</template>
