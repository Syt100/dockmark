<script setup lang="ts">
withDefaults(
  defineProps<{
    tone?: 'success' | 'error' | 'info'
    message: string | null
  }>(),
  {
    tone: 'info',
  },
)
</script>

<template>
  <Transition name="dm-feedback">
    <p
      v-if="message"
      :class="[
        'rounded-[var(--dm-radius-control)] border px-3 py-2 text-sm leading-6',
        tone === 'success' && 'border-transparent bg-[var(--dm-success-soft)] text-[var(--dm-success-text)]',
        tone === 'error' && 'border-transparent bg-[var(--dm-warning-soft)] text-[var(--dm-warning-text)]',
        tone === 'info' && 'border-transparent bg-[var(--dm-primary-soft)] text-[var(--dm-primary)]',
      ]"
    >
      {{ message }}
    </p>
  </Transition>
</template>
