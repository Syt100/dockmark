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

type ServiceRow = {
  item: ServiceItem
  categoryName: string
  primaryEndpoint: ServiceItem['endpoints'][number] | null
  visibleTags: ServiceItem['tags']
  hiddenTagCount: number
}

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

const serviceRows = computed<ServiceRow[]>(() =>
  filteredItems.value.map((item) => ({
    item,
    categoryName: categoryById.value.get(item.categoryId ?? '') ?? '未分类',
    primaryEndpoint: item.endpoints.find((endpoint) => endpoint.isPrimary) ?? item.endpoints[0] ?? null,
    visibleTags: item.tags.slice(0, 3),
    hiddenTagCount: Math.max(item.tags.length - 3, 0),
  })),
)

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

function isSavedValue(value: unknown): boolean {
  return value === 'created' || value === 'updated'
}

onMounted(() => {
  applyFlash(route.query.saved)
  void load()
})

watch(
  () => route.fullPath,
  () => {
    applyFlash(route.query.saved)

    if (!hasEditor.value && isSavedValue(route.query.saved)) {
      void load()
    }
  },
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

      <section class="grid gap-3">
        <div class="grid gap-3 md:grid-cols-[minmax(14rem,2fr)_minmax(9rem,1fr)_minmax(9rem,1fr)_minmax(9rem,1fr)_auto] md:items-center">
          <input
            v-model="query"
            aria-label="搜索服务"
            class="min-h-10 rounded-md bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline outline-1 outline-slate-200 transition placeholder:text-slate-400 focus:outline-2 focus:outline-blue-500"
            placeholder="搜索服务、URL、分类或标签"
          />
          <select
            v-model="selectedCategoryId"
            aria-label="按分类筛选服务"
            class="min-h-10 rounded-md bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline outline-1 outline-slate-200 transition focus:outline-2 focus:outline-blue-500"
          >
            <option value="">全部分类</option>
            <option value="__uncategorized">未分类</option>
            <option v-for="category in categories" :key="category.id" :value="category.id">{{ category.name }}</option>
          </select>
          <select
            v-model="selectedStatus"
            aria-label="按状态筛选服务"
            class="min-h-10 rounded-md bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline outline-1 outline-slate-200 transition focus:outline-2 focus:outline-blue-500"
          >
            <option value="">全部状态</option>
            <option v-for="(label, value) in statusLabels" :key="value" :value="value">{{ label }}</option>
          </select>
          <select
            v-model="selectedTagId"
            aria-label="按标签筛选服务"
            class="min-h-10 rounded-md bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline outline-1 outline-slate-200 transition focus:outline-2 focus:outline-blue-500"
          >
            <option value="">全部标签</option>
            <option v-for="tag in availableTags" :key="tag.id" :value="tag.id">{{ tag.name }}</option>
          </select>
          <AppButton :disabled="!hasFilters" tone="ghost" type="button" @click="clearFilters">清空</AppButton>
        </div>
      </section>

      <FeedbackMessage tone="success" :message="feedback" />
      <FeedbackMessage tone="error" :message="error" />

      <section v-if="isLoading" class="rounded-lg bg-white p-5 text-sm text-slate-600">
        正在加载服务...
      </section>

      <section v-else-if="filteredItems.length === 0" class="rounded-lg bg-white p-8 text-center">
        <p class="text-base font-medium text-slate-950">{{ hasFilters ? '没有符合筛选条件的服务' : '还没有服务' }}</p>
        <p class="mt-1 text-sm text-slate-600">{{ hasFilters ? '清空筛选或换一个条件试试。' : '可以新建服务，开始整理自部署入口。' }}</p>
        <div class="mt-4 flex justify-center gap-2">
          <AppButton v-if="hasFilters" type="button" @click="clearFilters">清空筛选</AppButton>
          <AppLinkButton to="/services/new" tone="primary">新建服务</AppLinkButton>
        </div>
      </section>

      <section v-else>
        <div class="hidden overflow-hidden rounded-lg bg-white md:block">
          <table class="w-full text-left text-sm">
            <thead class="bg-slate-50 text-xs font-medium text-slate-500">
              <tr>
                <th class="px-4 py-3 font-medium">服务</th>
                <th class="px-4 py-3 font-medium">主地址</th>
                <th class="px-4 py-3 font-medium">标签</th>
                <th class="px-4 py-3 font-medium">凭据与地址</th>
                <th class="px-4 py-3 text-right font-medium">操作</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="row in serviceRows" :key="row.item.id" class="transition hover:bg-blue-50/60">
                <td class="w-[30%] px-4 py-3 align-middle">
                  <div class="flex min-w-0 items-center gap-3">
                    <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-slate-100 text-base font-semibold text-slate-700">
                      {{ row.item.icon || '•' }}
                    </span>
                    <div class="min-w-0">
                      <div class="flex min-w-0 items-center gap-2">
                        <p class="truncate font-semibold text-slate-950">{{ row.item.name }}</p>
                        <span :class="['shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium', statusToneClasses[row.item.status]]">
                          {{ statusLabels[row.item.status] }}
                        </span>
                      </div>
                      <p class="mt-1 truncate text-xs text-slate-500">{{ row.categoryName }}</p>
                      <p v-if="row.item.description" class="mt-1 truncate text-xs text-slate-500">{{ row.item.description }}</p>
                    </div>
                  </div>
                </td>
                <td class="w-[27%] px-4 py-3 align-middle">
                  <template v-if="row.primaryEndpoint">
                    <a class="font-medium text-blue-700 hover:text-blue-800" :href="row.primaryEndpoint.url" target="_blank">
                      {{ row.primaryEndpoint.label }} · {{ endpointKindLabels[row.primaryEndpoint.kind] }}
                    </a>
                    <p class="mt-1 truncate text-xs text-slate-500">{{ row.primaryEndpoint.url }}</p>
                  </template>
                  <span v-else class="text-sm text-slate-400">未配置地址</span>
                </td>
                <td class="w-[18%] px-4 py-3 align-middle">
                  <div v-if="row.visibleTags.length > 0" class="flex flex-wrap gap-1.5">
                    <span v-for="tag in row.visibleTags" :key="tag.id" class="rounded bg-slate-100 px-2 py-1 text-xs text-slate-600">
                      {{ tag.name }}
                    </span>
                    <span v-if="row.hiddenTagCount > 0" class="rounded bg-slate-100 px-2 py-1 text-xs text-slate-500">
                      +{{ row.hiddenTagCount }}
                    </span>
                  </div>
                  <span v-else class="text-sm text-slate-400">无标签</span>
                </td>
                <td class="w-[15%] px-4 py-3 align-middle">
                  <p class="truncate text-sm text-slate-700">{{ row.item.credentialHint || '无凭据提示' }}</p>
                  <p class="mt-1 text-xs text-slate-500">{{ row.item.endpoints.length }} 个地址</p>
                </td>
                <td class="px-4 py-3 align-middle">
                  <div class="flex items-center justify-end gap-1">
                    <a
                      v-if="row.primaryEndpoint"
                      class="inline-flex min-h-10 items-center justify-center rounded-md px-3.5 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
                      :href="row.primaryEndpoint.url"
                      target="_blank"
                    >
                      打开
                    </a>
                    <AppLinkButton :to="`/services/${row.item.id}/edit`" tone="ghost">编辑</AppLinkButton>
                    <ConfirmAction :message="`确认删除服务“${row.item.name}”？`" @confirm="remove(row.item.id)" />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="grid gap-2 md:hidden">
          <article v-for="row in serviceRows" :key="row.item.id" class="rounded-lg bg-white p-4 transition hover:bg-blue-50/60">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <div class="flex min-w-0 items-center gap-2">
                  <p class="truncate text-base font-semibold text-slate-950">{{ row.item.icon || '•' }} {{ row.item.name }}</p>
                  <span :class="['shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium', statusToneClasses[row.item.status]]">
                    {{ statusLabels[row.item.status] }}
                  </span>
                </div>
                <p class="mt-1 text-sm text-slate-600">{{ row.categoryName }}</p>
              </div>
            </div>

            <p v-if="row.item.description" class="mt-3 text-sm leading-6 text-slate-600">{{ row.item.description }}</p>

            <div class="mt-3">
              <a
                v-if="row.primaryEndpoint"
                :href="row.primaryEndpoint.url"
                class="break-all text-sm font-medium text-blue-700"
                target="_blank"
              >
                {{ row.primaryEndpoint.label }} · {{ endpointKindLabels[row.primaryEndpoint.kind] }}
              </a>
              <p v-else class="text-sm text-slate-500">未配置地址</p>
            </div>

            <p v-if="row.item.credentialHint" class="mt-3 rounded-md bg-slate-100 px-3 py-2 text-xs text-slate-700">
              {{ row.item.credentialHint }}
            </p>

            <div v-if="row.visibleTags.length > 0" class="mt-3 flex flex-wrap gap-2">
              <span v-for="tag in row.visibleTags" :key="tag.id" class="rounded bg-slate-100 px-2 py-1 text-xs text-slate-600">
                {{ tag.name }}
              </span>
              <span v-if="row.hiddenTagCount > 0" class="rounded bg-slate-100 px-2 py-1 text-xs text-slate-500">
                +{{ row.hiddenTagCount }}
              </span>
            </div>

            <div class="mt-4 flex flex-wrap items-center justify-between gap-2">
              <span class="text-xs text-slate-500">{{ row.item.endpoints.length }} 个地址</span>
              <div class="flex flex-wrap gap-2">
                <AppLinkButton :to="`/services/${row.item.id}/edit`" tone="ghost">编辑</AppLinkButton>
                <ConfirmAction :message="`确认删除服务“${row.item.name}”？`" @confirm="remove(row.item.id)" />
              </div>
            </div>
          </article>
        </div>
      </section>
    </div>

    <RouterView />
  </main>
</template>
