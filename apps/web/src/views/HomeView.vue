<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import type { NavItem, NavResponse } from '@dockmark/shared'

import { fetchNavigation } from '../api/client'
import AppLinkButton from '../components/AppLinkButton.vue'
import FeedbackMessage from '../components/FeedbackMessage.vue'
import SearchInput from '../components/SearchInput.vue'
import ServiceNavCard from '../components/ServiceNavCard.vue'

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
  <main class="dm-page-grid">
    <section class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <p class="text-sm font-medium text-[var(--dm-primary)]">Dockmark</p>
        <h1 class="mt-1 text-3xl font-semibold tracking-normal text-[var(--dm-text)]">服务导航</h1>
        <p class="mt-2 max-w-2xl text-sm leading-6 text-[var(--dm-text-muted)]">
          集中打开公网、内网、Tailscale、管理后台、备份、文档和 API 地址。
        </p>
      </div>
      <div class="md:w-80">
        <SearchInput v-model="query" label="搜索服务导航" name="home-search" placeholder="服务、URL 或标签" />
      </div>
    </section>

    <FeedbackMessage tone="error" :message="error" />

    <section v-if="!nav && !error" class="dm-surface p-[var(--dm-panel-padding)] text-sm text-[var(--dm-text-muted)]">
      正在加载服务...
    </section>

    <section v-else-if="nav && totalItems === 0" class="dm-surface border-dashed p-8 text-center">
      <p class="text-base font-medium text-[var(--dm-text)]">还没有服务</p>
      <p class="mt-1 text-sm text-[var(--dm-text-muted)]">进入“服务”页面添加第一个自部署服务入口。</p>
      <div class="mt-4">
        <AppLinkButton to="/services/new" tone="primary">新建服务</AppLinkButton>
      </div>
    </section>

    <section v-else-if="nav && !hasVisibleItems" class="dm-surface border-dashed p-8 text-center">
      <p class="text-base font-medium text-[var(--dm-text)]">没有匹配结果</p>
      <p class="mt-1 text-sm text-[var(--dm-text-muted)]">换一个关键词试试。</p>
    </section>

    <section v-for="category in categories" :key="category.id" class="grid gap-3">
      <div class="flex items-center justify-between gap-3">
        <h2 class="text-lg font-semibold text-[var(--dm-text)]">{{ category.icon || '' }} {{ category.name }}</h2>
        <span class="text-xs text-[var(--dm-text-subtle)]">{{ category.items.length }} 个服务</span>
      </div>

      <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <ServiceNavCard v-for="item in category.items" :key="item.id" :item="item" />
      </div>
    </section>

    <section v-if="uncategorized.length > 0" class="grid gap-3">
      <div class="flex items-center justify-between gap-3">
        <h2 class="text-lg font-semibold text-[var(--dm-text)]">未分类</h2>
        <span class="text-xs text-[var(--dm-text-subtle)]">{{ uncategorized.length }} 个服务</span>
      </div>
      <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <ServiceNavCard v-for="item in uncategorized" :key="item.id" :item="item" />
      </div>
    </section>
  </main>
</template>
