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
  <p
    v-if="message"
    :class="[
      'rounded-md border px-3 py-2 text-sm leading-6',
      tone === 'success' && 'border-emerald-200 bg-emerald-50 text-emerald-800',
      tone === 'error' && 'border-amber-200 bg-amber-50 text-amber-900',
      tone === 'info' && 'border-blue-200 bg-blue-50 text-blue-800',
    ]"
  >
    {{ message }}
  </p>
</template>
