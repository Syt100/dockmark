<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import type { NavItem, NavResponse } from '@dockmark/shared'

import { fetchNavigation } from '../api/client'

const nav = ref<NavResponse | null>(null)
const query = ref('')
const error = ref<string | null>(null)

const normalizedQuery = computed(() => query.value.trim().toLowerCase())

function matches(item: NavItem): boolean {
  const q = normalizedQuery.value

  if (!q) {
    return true
  }

  return [
    item.name,
    item.description ?? '',
    item.primaryEndpoint.url,
    ...item.alternateEndpoints.map((endpoint) => endpoint.url),
    ...item.tags.map((tag) => tag.name),
  ].some((value) => value.toLowerCase().includes(q))
}

const categories = computed(() =>
  (nav.value?.categories ?? [])
    .map((category) => ({
      ...category,
      items: category.items.filter(matches),
    }))
    .filter((category) => category.items.length > 0),
)

const uncategorized = computed(() => (nav.value?.uncategorized ?? []).filter(matches))

async function load() {
  error.value = null

  try {
    nav.value = await fetchNavigation()
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : 'Unable to load navigation'
  }
}

onMounted(load)
</script>

<template>
  <main class="grid gap-6">
    <section class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <p class="text-sm font-medium text-blue-700">Dockmark</p>
        <h1 class="mt-1 text-3xl font-semibold text-slate-950">Service navigation</h1>
        <p class="mt-2 max-w-2xl text-sm text-slate-600">
          Open public, LAN, Tailscale, admin, backup, docs, and API endpoints from one dashboard.
        </p>
      </div>
      <label class="grid gap-1 text-sm md:w-80">
        <span class="font-medium text-slate-700">Search</span>
        <input v-model="query" class="rounded-md border border-slate-300 bg-white px-3 py-2" placeholder="Service, URL, tag..." />
      </label>
    </section>

    <p v-if="error" class="rounded-md bg-amber-50 p-3 text-sm text-amber-900">{{ error }}</p>

    <section v-if="!nav && !error" class="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
      Loading services...
    </section>

    <section v-for="category in categories" :key="category.id" class="grid gap-3">
      <h2 class="text-lg font-semibold text-slate-950">{{ category.icon || '' }} {{ category.name }}</h2>
      <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <article v-for="item in category.items" :key="item.id" class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div class="flex items-start justify-between gap-3">
            <div>
              <h3 class="font-semibold text-slate-950">{{ item.icon || '•' }} {{ item.name }}</h3>
              <p v-if="item.description" class="mt-1 text-sm text-slate-600">{{ item.description }}</p>
            </div>
            <a class="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white" :href="item.primaryEndpoint.url" target="_blank">
              Open
            </a>
          </div>

          <div class="mt-4 grid gap-2">
            <a class="text-sm text-blue-700" :href="item.primaryEndpoint.url" target="_blank">
              {{ item.primaryEndpoint.label }} · {{ item.primaryEndpoint.kind }}
            </a>
            <a
              v-for="endpoint in item.alternateEndpoints"
              :key="endpoint.id"
              class="text-sm text-slate-600"
              :href="endpoint.url"
              target="_blank"
            >
              {{ endpoint.label }} · {{ endpoint.kind }}
            </a>
          </div>

          <p v-if="item.credentialHint" class="mt-4 rounded-md bg-slate-100 p-2 text-xs text-slate-700">
            {{ item.credentialHint }}
          </p>

          <div v-if="item.tags.length > 0" class="mt-3 flex flex-wrap gap-2">
            <span v-for="tag in item.tags" :key="tag.id" class="rounded bg-slate-100 px-2 py-1 text-xs text-slate-600">
              {{ tag.name }}
            </span>
          </div>
        </article>
      </div>
    </section>

    <section v-if="uncategorized.length > 0" class="grid gap-3">
      <h2 class="text-lg font-semibold text-slate-950">Uncategorized</h2>
      <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <article v-for="item in uncategorized" :key="item.id" class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h3 class="font-semibold text-slate-950">{{ item.icon || '•' }} {{ item.name }}</h3>
          <a class="mt-3 inline-block text-sm text-blue-700" :href="item.primaryEndpoint.url" target="_blank">
            {{ item.primaryEndpoint.label }} · {{ item.primaryEndpoint.kind }}
          </a>
        </article>
      </div>
    </section>
  </main>
</template>
