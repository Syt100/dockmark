<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: 'service' | 'category' | 'tag'
    message: string
  }>(),
  {
    variant: 'tag',
  },
)
</script>

<template>
  <section class="dm-editor-loading" role="status" aria-live="polite">
    <p class="sr-only">{{ message }}</p>

    <div v-if="variant === 'service'" class="grid gap-[var(--dm-section-gap)]" aria-hidden="true">
      <div class="dm-editor-loading-section">
        <span class="dm-skeleton h-4 w-20"></span>
        <div class="grid gap-[var(--dm-form-gap)] md:grid-cols-3">
          <span class="dm-skeleton h-16"></span>
          <span class="dm-skeleton h-16"></span>
          <span class="dm-skeleton h-16"></span>
        </div>
        <div class="grid gap-[var(--dm-form-gap)] md:grid-cols-2">
          <span class="dm-skeleton h-14"></span>
          <span class="dm-skeleton h-14"></span>
        </div>
      </div>

      <div class="dm-editor-loading-section">
        <div class="flex items-center justify-between gap-3">
          <span class="dm-skeleton h-4 w-20"></span>
          <span class="dm-skeleton h-10 w-24"></span>
        </div>
        <span class="dm-skeleton h-12"></span>
        <span class="dm-skeleton h-24"></span>
      </div>

      <div class="dm-editor-loading-section">
        <div class="flex items-center justify-between gap-3">
          <span class="dm-skeleton h-4 w-14"></span>
          <span class="dm-skeleton h-3 w-16"></span>
        </div>
        <div class="flex flex-wrap gap-2">
          <span v-for="index in 5" :key="index" class="dm-skeleton h-10 w-20"></span>
        </div>
      </div>

      <div class="dm-editor-loading-section">
        <span class="dm-skeleton h-4 w-28"></span>
        <span class="dm-skeleton h-16"></span>
        <span class="dm-skeleton h-24"></span>
      </div>
    </div>

    <div v-else-if="variant === 'category'" class="dm-editor-loading-section" aria-hidden="true">
      <div class="grid gap-[var(--dm-form-gap)] md:grid-cols-2">
        <span class="dm-skeleton h-14"></span>
        <span class="dm-skeleton h-14"></span>
        <span class="dm-skeleton h-14"></span>
        <span class="dm-skeleton h-14"></span>
        <span class="dm-skeleton h-14 md:col-span-2"></span>
      </div>
    </div>

    <div v-else class="dm-editor-loading-section" aria-hidden="true">
      <span class="dm-skeleton h-14"></span>
      <span class="dm-skeleton h-14"></span>
    </div>

    <div class="flex flex-col-reverse gap-2 border-t border-[var(--dm-border)] pt-4 sm:flex-row sm:justify-end" aria-hidden="true">
      <span class="dm-skeleton h-10 w-full sm:w-20"></span>
      <span class="dm-skeleton h-10 w-full sm:w-24"></span>
    </div>
  </section>
</template>
