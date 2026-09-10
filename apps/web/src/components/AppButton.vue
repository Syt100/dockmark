<script setup lang="ts">
withDefaults(
  defineProps<{
    tone?: 'primary' | 'secondary' | 'danger' | 'ghost'
    size?: 'sm' | 'md'
    type?: 'button' | 'submit' | 'reset'
    disabled?: boolean
  }>(),
  {
    tone: 'secondary',
    size: 'md',
    type: 'button',
    disabled: false,
  },
)
</script>

<template>
  <button
    :class="[
      'inline-flex items-center justify-center whitespace-nowrap rounded-[var(--dm-radius-control)] text-sm font-medium transition active:scale-[0.98] motion-reduce:active:scale-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100',
      size === 'md' && 'min-h-10 px-3.5 py-2',
      size === 'sm' && 'min-h-8 px-2.5 py-1',
      tone === 'primary' &&
        'bg-[var(--dm-primary)] text-white hover:bg-[var(--dm-primary-hover)] focus-visible:outline-[var(--dm-focus)]',
      tone === 'secondary' &&
        'border border-[var(--dm-border-strong)] bg-[var(--dm-surface)] text-[var(--dm-text)] hover:bg-[var(--dm-surface-muted)] focus-visible:outline-[var(--dm-focus)]',
      tone === 'danger' &&
        'bg-[var(--dm-danger)] text-white hover:bg-[var(--dm-danger-hover)] focus-visible:outline-[var(--dm-danger)]',
      tone === 'ghost' &&
        'text-[var(--dm-text-muted)] hover:bg-[var(--dm-surface-muted)] hover:text-[var(--dm-text)] focus-visible:outline-[var(--dm-focus)]',
    ]"
    :disabled="disabled"
    :type="type"
  >
    <slot />
  </button>
</template>
