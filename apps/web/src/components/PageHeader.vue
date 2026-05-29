<script setup lang="ts">
defineProps<{
  title: string
  description?: string
}>()
</script>

<template>
  <section class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
    <div class="min-w-0">
      <h1 class="text-2xl font-semibold tracking-normal text-[var(--dm-text)]">{{ title }}</h1>
      <p v-if="description" class="mt-1 max-w-3xl text-sm leading-6 text-[var(--dm-text-muted)]">{{ description }}</p>
    </div>
    <div v-if="$slots.actions" class="flex flex-wrap items-center gap-[var(--dm-toolbar-gap)]">
      <slot name="actions" />
    </div>
  </section>
</template>
