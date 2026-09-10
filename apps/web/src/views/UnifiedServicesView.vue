<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'

import HomeView from './HomeView.vue'

const ManagementView = defineAsyncComponent(() => import('./ServicesView.vue'))

const route = useRoute()
const hasEditor = computed(() => route.name === 'service-new' || route.name === 'service-edit')
const isManagement = computed(() => route.query.mode === 'manage')
const showManagement = computed(() => isManagement.value && !hasEditor.value)
</script>

<template>
  <main class="dm-page-grid">
    <div :class="hasEditor ? 'hidden md:grid md:gap-[var(--dm-section-gap)]' : 'dm-page-grid'">
      <div
        class="inline-flex w-fit items-center gap-1 rounded-[var(--dm-radius-control)] bg-[var(--dm-surface-muted)] p-1 text-sm"
        role="tablist"
        aria-label="服务视图"
      >
        <RouterLink
          class="rounded-[var(--dm-radius-control)] px-3 py-1.5 font-medium transition-colors"
          :class="
            !isManagement
              ? 'bg-[var(--dm-surface)] text-[var(--dm-primary)] shadow-sm'
              : 'text-[var(--dm-text-muted)] hover:text-[var(--dm-text)]'
          "
          role="tab"
          :aria-selected="!isManagement"
          to="/services"
        >
          导航
        </RouterLink>
        <RouterLink
          class="rounded-[var(--dm-radius-control)] px-3 py-1.5 font-medium transition-colors"
          :class="
            isManagement
              ? 'bg-[var(--dm-surface)] text-[var(--dm-primary)] shadow-sm'
              : 'text-[var(--dm-text-muted)] hover:text-[var(--dm-text)]'
          "
          role="tab"
          :aria-selected="isManagement"
          :to="{ path: '/services', query: { mode: 'manage' } }"
        >
          管理
        </RouterLink>
      </div>

      <ManagementView v-if="showManagement" />
      <HomeView v-else />
    </div>

    <RouterView />
  </main>
</template>
