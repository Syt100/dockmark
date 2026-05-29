<script setup lang="ts">
import { RouterLink } from 'vue-router'

withDefaults(
  defineProps<{
    to: string
    tone?: 'primary' | 'secondary' | 'danger' | 'ghost'
  }>(),
  {
    tone: 'secondary',
  },
)
</script>

<template>
  <RouterLink
    :class="[
      'inline-flex min-h-10 items-center justify-center whitespace-nowrap rounded-[var(--dm-radius-control)] px-3.5 py-2 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
      tone === 'primary' && 'bg-[var(--dm-primary)] text-white hover:bg-[var(--dm-primary-hover)] focus-visible:outline-[var(--dm-focus)]',
      tone === 'secondary' && 'border border-[var(--dm-border-strong)] bg-[var(--dm-surface)] text-[var(--dm-text)] hover:bg-[var(--dm-surface-muted)] focus-visible:outline-[var(--dm-focus)]',
      tone === 'danger' && 'bg-[var(--dm-danger)] text-white hover:bg-[var(--dm-danger-hover)] focus-visible:outline-[var(--dm-danger)]',
      tone === 'ghost' && 'text-[var(--dm-text-muted)] hover:bg-[var(--dm-surface-muted)] hover:text-[var(--dm-text)] focus-visible:outline-[var(--dm-focus)]',
    ]"
    :to="to"
  >
    <slot />
  </RouterLink>
</template>
