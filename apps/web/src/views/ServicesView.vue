<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterView, useRoute } from 'vue-router'

import type { Category, ServiceItem } from '@dockmark/shared'

import { deleteItem, fetchCategories, fetchItems } from '../api/client'
import { toChineseError } from '../api/errors'
import AppLinkButton from '../components/AppLinkButton.vue'
import AppButton from '../components/AppButton.vue'
import ConfirmAction from '../components/ConfirmAction.vue'
import FeedbackMessage from '../components/FeedbackMessage.vue'
import PageHeader from '../components/PageHeader.vue'
import { endpointKindLabels, statusLabels, statusToneClasses } from '../ui/labels'

const route = useRoute()
const items = ref<ServiceItem[]>([])
const categories = ref<Category[]>([])
const error = ref<string | null>(null)
const feedback = ref<string | null>(null)
const isLoading = ref(false)
const query = ref('')
const selectedCategoryId = ref('')
const selectedStatus = ref('')
const selectedTagId = ref('')
const categoryById = computed(() => new Map(categories.value.map((category) => [category.id, category.name])))
const hasEditor = computed(() => route.name === 'service-new' || route.name === 'service-edit')
const hasFilters = computed(
  () => query.value.trim().length > 0 || selectedCategoryId.value !== '' || selectedStatus.value !== '' || selectedTagId.value !== '',
)
const availableTags = computed(() => {
  const map = new Map<string, ServiceItem['tags'][number]>()

  for (const item of items.value) {
    for (const tag of item.tags) {
      map.set(tag.id, tag)
    }
  }

  return [...map.values()].sort((left, right) => left.name.localeCompare(right.name))
})

const filteredItems = computed(() => {
  const q = query.value.trim().toLowerCase()

  return items.value.filter((item) =>
    (!q ||
      [
        item.name,
        item.description ?? '',
        item.credentialHint ?? '',
        categoryById.value.get(item.categoryId ?? '') ?? '',
        ...item.tags.map((tag) => tag.name),
        ...item.endpoints.map((endpoint) => `${endpoint.label} ${endpoint.url} ${endpoint.kind}`),
      ].some((value) => value.toLowerCase().includes(q))) &&
    (!selectedCategoryId.value ||
      (selectedCategoryId.value === '__uncategorized' ? item.categoryId === null : item.categoryId === selectedCategoryId.value)) &&
    (!selectedStatus.value || item.status === selectedStatus.value) &&
    (!selectedTagId.value || item.tags.some((tag) => tag.id === selectedTagId.value)),
  )
})

async function load() {
  isLoading.value = true
  error.value = null

  try {
    const [nextItems, nextCategories] = await Promise.all([fetchItems(), fetchCategories()])
    items.value = nextItems
    categories.value = nextCategories
  } catch (caught) {
    error.value = toChineseError(caught, '加载服务失败')
  } finally {
    isLoading.value = false
  }
}

async function remove(id: string) {
  error.value = null
  feedback.value = null

  try {
    await deleteItem(id)
    feedback.value = '服务已删除'
    await load()
  } catch (caught) {
    error.value = toChineseError(caught, '删除服务失败')
  }
}

function clearFilters() {
  query.value = ''
  selectedCategoryId.value = ''
  selectedStatus.value = ''
  selectedTagId.value = ''
}

function applyFlash(value: unknown) {
  if (value === 'created') {
    feedback.value = '服务已创建'
  } else if (value === 'updated') {
    feedback.value = '服务已保存'
  }
}

onMounted(() => {
  applyFlash(route.query.saved)
  void load()
})

watch(
  () => route.query.saved,
  (value) => applyFlash(value),
)
</script>

<template>
  <main class="grid gap-6">
    <div :class="hasEditor ? 'hidden md:grid md:gap-6' : 'grid gap-6'">
      <PageHeader title="服务" description="管理自部署服务、访问地址、标签和 Vaultwarden 搜索提示。">
        <template #actions>
          <AppLinkButton to="/services/new" tone="primary">新建服务</AppLinkButton>
        </template>
      </PageHeader>

      <section class="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div class="grid gap-4 md:grid-cols-[2fr_1fr_1fr_1fr_auto] md:items-end">
          <label class="grid gap-1 text-sm">
          <span class="font-medium text-slate-700">搜索服务</span>
          <input v-model="query" class="rounded-md border border-slate-300 px-3 py-2" placeholder="服务名称、URL、分类或标签" />
          </label>
          <label class="grid gap-1 text-sm">
            <span class="font-medium text-slate-700">分类</span>
            <select v-model="selectedCategoryId" class="rounded-md border border-slate-300 bg-white px-3 py-2">
              <option value="">全部分类</option>
              <option value="__uncategorized">未分类</option>
              <option v-for="category in categories" :key="category.id" :value="category.id">{{ category.name }}</option>
            </select>
          </label>
          <label class="grid gap-1 text-sm">
            <span class="font-medium text-slate-700">状态</span>
            <select v-model="selectedStatus" class="rounded-md border border-slate-300 bg-white px-3 py-2">
              <option value="">全部状态</option>
              <option v-for="(label, value) in statusLabels" :key="value" :value="value">{{ label }}</option>
            </select>
          </label>
          <label class="grid gap-1 text-sm">
            <span class="font-medium text-slate-700">标签</span>
            <select v-model="selectedTagId" class="rounded-md border border-slate-300 bg-white px-3 py-2">
              <option value="">全部标签</option>
              <option v-for="tag in availableTags" :key="tag.id" :value="tag.id">{{ tag.name }}</option>
            </select>
          </label>
          <AppButton :disabled="!hasFilters" type="button" @click="clearFilters">清空筛选</AppButton>
        </div>
      </section>

      <FeedbackMessage tone="success" :message="feedback" />
      <FeedbackMessage tone="error" :message="error" />

      <section v-if="isLoading" class="rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-sm">
        正在加载服务...
      </section>

      <section v-else-if="filteredItems.length === 0" class="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
        <p class="text-base font-medium text-slate-950">{{ hasFilters ? '没有符合筛选条件的服务' : '还没有服务' }}</p>
        <p class="mt-1 text-sm text-slate-600">{{ hasFilters ? '清空筛选或换一个条件试试。' : '可以新建服务，开始整理自部署入口。' }}</p>
        <div class="mt-4 flex justify-center gap-2">
          <AppButton v-if="hasFilters" type="button" @click="clearFilters">清空筛选</AppButton>
          <AppLinkButton to="/services/new" tone="primary">新建服务</AppLinkButton>
        </div>
      </section>

      <section v-else class="grid gap-3">
        <article v-for="item in filteredItems" :key="item.id" class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <p class="text-lg font-semibold text-slate-950">{{ item.icon || '•' }} {{ item.name }}</p>
                <span :class="['rounded-full border px-2 py-0.5 text-xs font-medium', statusToneClasses[item.status]]">
                  {{ statusLabels[item.status] }}
                </span>
              </div>
              <p class="mt-1 text-sm text-slate-600">{{ categoryById.get(item.categoryId || '') || '未分类' }}</p>
              <p v-if="item.description" class="mt-2 text-sm leading-6 text-slate-600">{{ item.description }}</p>
              <p v-if="item.credentialHint" class="mt-3 rounded-md bg-slate-100 px-3 py-2 text-xs text-slate-700">
                {{ item.credentialHint }}
              </p>
            </div>

            <div class="flex flex-wrap items-center gap-2 lg:justify-end">
              <AppLinkButton :to="`/services/${item.id}/edit`">编辑</AppLinkButton>
              <ConfirmAction :message="`确认删除服务“${item.name}”？`" @confirm="remove(item.id)" />
            </div>
          </div>

          <div class="mt-4 flex flex-wrap gap-2">
            <a
              v-for="endpoint in item.endpoints"
              :key="endpoint.id"
              :href="endpoint.url"
              class="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-700 hover:bg-slate-200"
              target="_blank"
            >
              {{ endpoint.label }} · {{ endpointKindLabels[endpoint.kind] }}{{ endpoint.isPrimary ? ' · 主地址' : '' }}
            </a>
          </div>

          <div v-if="item.tags.length > 0" class="mt-3 flex flex-wrap gap-2">
            <span v-for="tag in item.tags" :key="tag.id" class="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600">
              {{ tag.name }}
            </span>
          </div>
        </article>
      </section>
    </div>

    <RouterView @vue:unmounted="load" />
  </main>
</template>
