<script setup lang="ts">
import { RouterLink } from 'vue-router'

defineProps<{
  title: string
  backTo: string
}>()
</script>

<template>
  <div>
    <div class="md:hidden">
      <div class="mb-4 flex items-center justify-between gap-3">
        <RouterLink class="text-sm font-medium text-[var(--dm-text-muted)] hover:text-[var(--dm-text)]" :to="backTo">返回</RouterLink>
        <h1 class="text-lg font-semibold text-[var(--dm-text)]">{{ title }}</h1>
        <span class="w-8" aria-hidden="true"></span>
      </div>
      <slot />
    </div>

    <div class="hidden md:block">
      <div class="fixed inset-0 z-30 bg-[var(--dm-overlay)]" aria-hidden="true"></div>
      <section
        class="fixed left-1/2 top-1/2 z-40 max-h-[calc(100dvh-4rem)] w-[min(760px,calc(100vw-3rem))] -translate-x-1/2 -translate-y-1/2 overflow-auto rounded-[var(--dm-radius-surface)] bg-[var(--dm-surface-elevated)] shadow-[var(--dm-shadow-elevated)]"
        role="dialog"
        aria-modal="true"
        :aria-label="title"
      >
        <div class="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--dm-border)] bg-[var(--dm-surface-elevated)] px-5 py-4">
          <h1 class="text-lg font-semibold text-[var(--dm-text)]">{{ title }}</h1>
          <RouterLink class="text-sm font-medium text-[var(--dm-text-muted)] hover:text-[var(--dm-text)]" :to="backTo">关闭</RouterLink>
        </div>
        <div class="p-5">
          <slot />
        </div>
      </section>
    </div>
  </div>
</template>
