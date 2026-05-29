<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'

import ThemeToggle from './components/ThemeToggle.vue'

const navItems = [
  { to: '/', label: '首页' },
  { to: '/services', label: '服务' },
  { to: '/categories', label: '分类' },
  { to: '/tags', label: '标签' },
  { to: '/about', label: '关于' },
]
</script>

<template>
  <div class="min-h-screen bg-[var(--dm-bg)] text-[var(--dm-text)]">
    <header class="border-b border-[var(--dm-border)] bg-[var(--dm-surface)]">
      <div class="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 sm:px-6 md:flex-row md:items-center md:justify-between">
        <RouterLink to="/" class="text-lg font-semibold text-[var(--dm-text)]">Dockmark</RouterLink>

        <div class="flex items-center gap-2">
          <nav class="flex items-center gap-1 overflow-x-auto text-sm text-[var(--dm-text-muted)]">
            <RouterLink
              v-for="item in navItems"
              :key="item.to"
              class="shrink-0 rounded-[var(--dm-radius-control)] px-3 py-2 transition hover:bg-[var(--dm-surface-muted)] hover:text-[var(--dm-text)] aria-[current=page]:bg-[var(--dm-primary-soft)] aria-[current=page]:text-[var(--dm-primary)]"
              :to="item.to"
            >
              {{ item.label }}
            </RouterLink>
          </nav>
          <ThemeToggle />
        </div>
      </div>
    </header>

    <div class="mx-auto max-w-6xl px-[var(--dm-page-x)] py-[var(--dm-page-y)]">
      <RouterView />
    </div>
  </div>
</template>
