<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink, RouterView } from 'vue-router'

import { currentUser, signOut } from './auth/state'
import AppButton from './components/AppButton.vue'
import ThemeToggle from './components/ThemeToggle.vue'
import { routeTransitionKey } from './router/motion'

const navItems = [
  { to: '/', label: '首页' },
  { to: '/services', label: '服务' },
  { to: '/categories', label: '分类' },
  { to: '/tags', label: '标签' },
  { to: '/about', label: '关于' },
]

const loggingOut = ref(false)
const userLabel = computed(() => currentUser.value?.email ?? currentUser.value?.name ?? '')

async function logout() {
  loggingOut.value = true

  try {
    await signOut()
    window.location.assign('/login')
  } finally {
    loggingOut.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-[var(--dm-bg)] text-[var(--dm-text)]">
    <header class="border-b border-[var(--dm-border)] bg-[var(--dm-surface)]">
      <div class="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-3 sm:px-6 sm:py-4 md:flex-row md:items-center md:justify-between">
        <RouterLink to="/" class="text-lg font-semibold text-[var(--dm-text)]">Dockmark</RouterLink>

        <div class="flex flex-wrap items-center gap-2 md:justify-end">
          <nav v-if="currentUser" class="-mx-1 flex max-w-full items-center gap-1 overflow-x-auto px-1 text-sm text-[var(--dm-text-muted)]">
            <RouterLink
              v-for="item in navItems"
              :key="item.to"
              class="shrink-0 rounded-[var(--dm-radius-control)] px-2.5 py-1.5 transition hover:bg-[var(--dm-surface-muted)] hover:text-[var(--dm-text)] aria-[current=page]:bg-[var(--dm-primary-soft)] aria-[current=page]:text-[var(--dm-primary)] sm:px-3 sm:py-2"
              :to="item.to"
            >
              {{ item.label }}
            </RouterLink>
          </nav>
          <div v-if="currentUser" class="hidden items-center gap-2 text-sm text-[var(--dm-text-muted)] sm:flex">
            <span class="max-w-40 truncate">{{ userLabel }}</span>
            <AppButton :disabled="loggingOut" size="sm" tone="ghost" @click="logout">
              退出
            </AppButton>
          </div>
          <ThemeToggle />
        </div>
      </div>
    </header>

    <div class="mx-auto max-w-6xl px-[var(--dm-page-x)] py-[var(--dm-page-y)]">
      <RouterView v-slot="{ Component, route }">
        <Transition mode="out-in" name="dm-route">
          <component :is="Component" :key="routeTransitionKey(route)" />
        </Transition>
      </RouterView>
    </div>
  </div>
</template>
