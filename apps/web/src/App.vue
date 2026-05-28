<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <div class="min-h-screen bg-slate-50">
    <header class="border-b border-slate-200 bg-white">
      <div class="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <RouterLink to="/" class="text-lg font-semibold text-slate-950">dockmark</RouterLink>

        <nav class="flex items-center gap-4 text-sm text-slate-600">
          <RouterLink class="hover:text-slate-950" to="/">Home</RouterLink>
          <RouterLink class="hover:text-slate-950" to="/about">About</RouterLink>
        </nav>
      </div>
    </header>

    <div class="mx-auto max-w-6xl px-6 py-8">
      <RouterView />
    </div>
  </div>
</template>
