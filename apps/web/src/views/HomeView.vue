<script setup lang="ts">
import { onMounted, ref } from 'vue'

import type { HealthResponse } from '@dockmark/shared'

const health = ref<HealthResponse | null>(null)
const error = ref<string | null>(null)

onMounted(async () => {
  try {
    const response = await fetch('/api/health')

    if (!response.ok) {
      throw new Error(`Health check failed with ${response.status}`)
    }

    health.value = await response.json() as HealthResponse
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : 'Unable to reach Worker API'
  }
})
</script>

<template>
  <main class="grid gap-6">
    <section class="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <p class="text-sm font-medium text-blue-700">Phase 0 foundation</p>
      <h1 class="mt-2 text-3xl font-semibold text-slate-950">Dockmark is starting up</h1>
      <p class="mt-3 max-w-2xl text-slate-600">
        This shell verifies that the Vue app can talk to the Cloudflare Worker API before
        service navigation is implemented.
      </p>
    </section>

    <section class="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <h2 class="text-base font-semibold text-slate-950">Worker health</h2>

      <div v-if="health" class="mt-4 rounded-md bg-emerald-50 p-4 text-sm text-emerald-900">
        {{ health.service }} is reachable. Version {{ health.version }}.
      </div>

      <div v-else-if="error" class="mt-4 rounded-md bg-amber-50 p-4 text-sm text-amber-900">
        {{ error }}
      </div>

      <div v-else class="mt-4 rounded-md bg-slate-100 p-4 text-sm text-slate-600">
        Checking Worker API...
      </div>
    </section>
  </main>
</template>
