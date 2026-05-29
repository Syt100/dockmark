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
      'inline-flex min-h-10 items-center justify-center rounded-md px-3.5 py-2 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
      tone === 'primary' && 'bg-blue-600 text-white hover:bg-blue-700 focus-visible:outline-blue-600',
      tone === 'secondary' && 'border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 focus-visible:outline-blue-600',
      tone === 'danger' && 'bg-rose-600 text-white hover:bg-rose-700 focus-visible:outline-rose-600',
      tone === 'ghost' && 'text-slate-600 hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-blue-600',
    ]"
    :to="to"
  >
    <slot />
  </RouterLink>
</template>
