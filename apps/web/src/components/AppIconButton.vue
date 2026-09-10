<script setup lang="ts">
withDefaults(
  defineProps<{
    label: string
    type?: 'button' | 'submit' | 'reset'
    disabled?: boolean
  }>(),
  {
    type: 'button',
    disabled: false,
  },
)
</script>

<template>
  <button
    class="inline-flex h-10 w-10 items-center justify-center rounded-[var(--dm-radius-control)] text-[var(--dm-text-muted)] transition active:scale-[0.96] motion-reduce:active:scale-100 hover:bg-[var(--dm-surface-muted)] hover:text-[var(--dm-text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--dm-focus)] disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100"
    :aria-label="label"
    :disabled="disabled"
    :title="label"
    :type="type"
  >
    <slot />
  </button>
</template>
