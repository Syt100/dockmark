<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'

const navItems = [
  { to: '/', label: '首页' },
  { to: '/services', label: '服务' },
  { to: '/categories', label: '分类' },
  { to: '/tags', label: '标签' },
  { to: '/about', label: '关于' },
]
</script>

<template>
  <div class="min-h-screen bg-slate-50">
    <header class="border-b border-slate-200 bg-white">
      <div class="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 sm:px-6 md:flex-row md:items-center md:justify-between">
        <RouterLink to="/" class="text-lg font-semibold text-slate-950">Dockmark</RouterLink>

        <nav class="flex items-center gap-1 overflow-x-auto text-sm text-slate-600">
          <RouterLink
            v-for="item in navItems"
            :key="item.to"
            class="shrink-0 rounded-md px-3 py-2 hover:bg-slate-100 hover:text-slate-950 aria-[current=page]:bg-slate-950 aria-[current=page]:text-white"
            :to="item.to"
          >
            {{ item.label }}
          </RouterLink>
        </nav>
      </div>
    </header>

    <div class="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <RouterView />
    </div>
  </div>
</template>
