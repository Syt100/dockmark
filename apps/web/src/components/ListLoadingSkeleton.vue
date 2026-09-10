<script setup lang="ts">
withDefaults(
  defineProps<{
    label: string
    rows?: number
  }>(),
  {
    rows: 5,
  },
)
</script>

<template>
  <section class="min-h-[22rem]" role="status" aria-busy="true" :aria-label="label">
    <span class="sr-only">{{ label }}</span>

    <div class="dm-list-shell hidden md:block" aria-hidden="true">
      <div class="dm-list-head flex h-10 items-center px-4">
        <span class="dm-skeleton h-3 w-28"></span>
      </div>
      <div class="divide-y divide-[var(--dm-border)]">
        <div
          v-for="index in rows"
          :key="index"
          class="grid min-h-16 grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_8rem] items-center gap-4 px-4 py-3"
        >
          <div class="flex items-center gap-3">
            <span class="dm-skeleton h-9 w-9 shrink-0"></span>
            <span class="dm-skeleton h-4 w-2/3"></span>
          </div>
          <span class="dm-skeleton h-4 w-3/4"></span>
          <span class="dm-skeleton h-8 w-full"></span>
        </div>
      </div>
    </div>

    <div class="grid gap-2 md:hidden" aria-hidden="true">
      <div v-for="index in rows" :key="index" class="dm-mobile-card grid gap-3">
        <div class="flex items-center gap-3">
          <span class="dm-skeleton h-9 w-9 shrink-0"></span>
          <span class="dm-skeleton h-4 w-1/2"></span>
        </div>
        <span class="dm-skeleton h-3 w-4/5"></span>
        <span class="dm-skeleton h-3 w-2/3"></span>
        <div class="flex justify-end gap-2">
          <span class="dm-skeleton h-8 w-16"></span>
          <span class="dm-skeleton h-8 w-16"></span>
        </div>
      </div>
    </div>
  </section>
</template>
