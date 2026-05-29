<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import type { NavItem, NavResponse } from '@dockmark/shared'

import { fetchNavigation } from '../api/client'
import FeedbackMessage from '../components/FeedbackMessage.vue'
import AppLinkButton from '../components/AppLinkButton.vue'
import { endpointKindLabels } from '../ui/labels'

const nav = ref<NavResponse | null>(null)
const query = ref('')
const error = ref<string | null>(null)

const normalizedQuery = computed(() => query.value.trim().toLowerCase())

function matches(item: NavItem, categoryName = ''): boolean {
  const q = normalizedQuery.value

  if (!q) {
    return true
  }

  return [
    item.name,
    item.description ?? '',
    categoryName,
    item.primaryEndpoint.url,
    ...item.alternateEndpoints.map((endpoint) => endpoint.url),
    ...item.tags.map((tag) => tag.name),
  ].some((value) => value.toLowerCase().includes(q))
}

const categories = computed(() =>
  (nav.value?.categories ?? [])
    .map((category) => ({
      ...category,
      items: category.items.filter((item) => matches(item, category.name)),
    }))
    .filter((category) => category.items.length > 0),
)

const uncategorized = computed(() => (nav.value?.uncategorized ?? []).filter((item) => matches(item, '未分类')))
const hasVisibleItems = computed(() => categories.value.length > 0 || uncategorized.value.length > 0)
const totalItems = computed(
  () =>
    (nav.value?.categories ?? []).reduce((count, category) => count + category.items.length, 0) +
    (nav.value?.uncategorized.length ?? 0),
)

async function load() {
  error.value = null

  try {
    nav.value = await fetchNavigation()
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : '加载导航失败'
  }
}

onMounted(load)
</script>

<template>
  <main class="grid gap-6">
    <section class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <p class="text-sm font-medium text-blue-700">Dockmark</p>
        <h1 class="mt-1 text-3xl font-semibold tracking-normal text-slate-950">服务导航</h1>
        <p class="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          集中打开公网、内网、Tailscale、管理后台、备份、文档和 API 地址。
        </p>
      </div>
      <label class="grid gap-1 text-sm md:w-80">
        <span class="font-medium text-slate-700">搜索</span>
        <input v-model="query" class="rounded-md border border-slate-300 bg-white px-3 py-2" placeholder="服务、URL 或标签" />
      </label>
    </section>

    <FeedbackMessage tone="error" :message="error" />

    <section v-if="!nav && !error" class="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
      正在加载服务...
    </section>

    <section v-else-if="nav && totalItems === 0" class="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
      <p class="text-base font-medium text-slate-950">还没有服务</p>
      <p class="mt-1 text-sm text-slate-600">进入“服务”页面添加第一个自部署服务入口。</p>
      <div class="mt-4">
        <AppLinkButton to="/services/new" tone="primary">新建服务</AppLinkButton>
      </div>
    </section>

    <section v-else-if="nav && !hasVisibleItems" class="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
      <p class="text-base font-medium text-slate-950">没有匹配结果</p>
      <p class="mt-1 text-sm text-slate-600">换一个关键词试试。</p>
    </section>

    <section v-for="category in categories" :key="category.id" class="grid gap-3">
      <div class="flex items-center justify-between gap-3">
        <h2 class="text-lg font-semibold text-slate-950">{{ category.icon || '' }} {{ category.name }}</h2>
        <span class="text-xs text-slate-500">{{ category.items.length }} 个服务</span>
      </div>

      <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <article v-for="item in category.items" :key="item.id" class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <h3 class="font-semibold text-slate-950">{{ item.icon || '•' }} {{ item.name }}</h3>
              <p v-if="item.description" class="mt-1 text-sm leading-6 text-slate-600">{{ item.description }}</p>
            </div>
            <a
              class="shrink-0 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
              :href="item.primaryEndpoint.url"
              target="_blank"
            >
              打开
            </a>
          </div>

          <div class="mt-4 grid gap-2">
            <a class="break-all text-sm font-medium text-blue-700" :href="item.primaryEndpoint.url" target="_blank">
              {{ item.primaryEndpoint.label }} · {{ endpointKindLabels[item.primaryEndpoint.kind] }}
            </a>
            <a
              v-for="endpoint in item.alternateEndpoints"
              :key="endpoint.id"
              class="break-all text-sm text-slate-600 hover:text-slate-950"
              :href="endpoint.url"
              target="_blank"
            >
              {{ endpoint.label }} · {{ endpointKindLabels[endpoint.kind] }}
            </a>
          </div>

          <p v-if="item.credentialHint" class="mt-4 rounded-md bg-slate-100 p-2 text-xs leading-5 text-slate-700">
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
      <div class="flex items-center justify-between gap-3">
        <h2 class="text-lg font-semibold text-slate-950">未分类</h2>
        <span class="text-xs text-slate-500">{{ uncategorized.length }} 个服务</span>
      </div>
      <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <article v-for="item in uncategorized" :key="item.id" class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <h3 class="font-semibold text-slate-950">{{ item.icon || '•' }} {{ item.name }}</h3>
              <p v-if="item.description" class="mt-1 text-sm leading-6 text-slate-600">{{ item.description }}</p>
            </div>
            <a class="shrink-0 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white" :href="item.primaryEndpoint.url" target="_blank">
              打开
            </a>
          </div>

          <div class="mt-4 grid gap-2">
            <a class="break-all text-sm font-medium text-blue-700" :href="item.primaryEndpoint.url" target="_blank">
              {{ item.primaryEndpoint.label }} · {{ endpointKindLabels[item.primaryEndpoint.kind] }}
            </a>
            <a
              v-for="endpoint in item.alternateEndpoints"
              :key="endpoint.id"
              class="break-all text-sm text-slate-600 hover:text-slate-950"
              :href="endpoint.url"
              target="_blank"
            >
              {{ endpoint.label }} · {{ endpointKindLabels[endpoint.kind] }}
            </a>
          </div>

          <p v-if="item.credentialHint" class="mt-4 rounded-md bg-slate-100 p-2 text-xs leading-5 text-slate-700">
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
  </main>
</template>
