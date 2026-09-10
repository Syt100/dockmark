<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const props = withDefaults(
  defineProps<{
    label: string
    rows?: number
    variant?: 'cards' | 'list'
  }>(),
  {
    rows: 5,
    variant: undefined,
  },
)

const route = useRoute()
const resolvedVariant = computed(() => {
  if (props.variant) {
    return props.variant
  }

  return route.path.startsWith('/services') && route.query.view !== 'list' ? 'cards' : 'list'
})
</script>

<template>
  <section class="min-h-[22rem]" role="status" aria-busy="true" :aria-label="label">
    <span class="sr-only">{{ label }}</span>

    <div
      v-if="resolvedVariant === 'cards'"
      class="grid gap-[var(--dm-section-gap)]"
      data-loading-layout="cards"
      aria-hidden="true"
    >
      <div class="grid gap-3">
        <div class="flex items-center justify-between gap-3">
          <span class="dm-skeleton h-5 w-28"></span>
          <span class="dm-skeleton h-3 w-16"></span>
        </div>

        <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <article
            v-for="index in 6"
            :key="index"
            class="dm-surface min-h-[10.5rem] p-[var(--dm-panel-padding)]"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="flex min-w-0 flex-1 items-start gap-3">
                <span class="dm-skeleton h-10 w-10 shrink-0"></span>
                <div class="grid min-w-0 flex-1 gap-2 pt-0.5">
                  <span class="dm-skeleton h-4 w-2/3"></span>
                  <span class="dm-skeleton h-3 w-5/6"></span>
                </div>
              </div>
              <div class="flex shrink-0 gap-1">
                <span class="dm-skeleton h-9 w-9"></span>
                <span class="dm-skeleton h-9 w-14"></span>
              </div>
            </div>

            <div class="mt-4 grid gap-2">
              <div class="flex items-center justify-between gap-3 px-2 py-1.5">
                <span class="dm-skeleton h-3 w-24"></span>
                <span class="dm-skeleton h-5 w-12"></span>
              </div>
              <div class="flex items-center justify-between gap-3 px-2 py-1.5">
                <span class="dm-skeleton h-3 w-32"></span>
                <span class="dm-skeleton h-5 w-14"></span>
              </div>
            </div>
          </article>
        </div>
      </div>
    </div>

    <template v-else>
      <div class="dm-list-shell hidden lg:block" data-loading-layout="list" aria-hidden="true">
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

      <div class="grid gap-2 lg:hidden" data-loading-layout="list" aria-hidden="true">
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
    </template>
  </section>
</template>
