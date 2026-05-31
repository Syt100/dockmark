<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterView, useRoute } from 'vue-router'

import type { Category, ServiceItem } from '@dockmark/shared'

import { deleteItem, fetchCategories, fetchItems } from '../api/client'
import AppBadge from '../components/AppBadge.vue'
import AppButton from '../components/AppButton.vue'
import AppLinkButton from '../components/AppLinkButton.vue'
import AppSelect from '../components/AppSelect.vue'
import ConfirmAction from '../components/ConfirmAction.vue'
import FeedbackMessage from '../components/FeedbackMessage.vue'
import PageHeader from '../components/PageHeader.vue'
import SearchInput from '../components/SearchInput.vue'
import { useManagementList } from '../composables/managementList'
import { endpointKindLabels, statusLabels, statusToneClasses } from '../ui/labels'
import { matchesSearchQuery } from '../ui/search'

type ServiceRow = {
  item: ServiceItem
  categoryName: string
  primaryEndpoint: ServiceItem['endpoints'][number] | null
  visibleTags: ServiceItem['tags']
  hiddenTagCount: number
}

const route = useRoute()
const categories = ref<Category[]>([])
const query = ref('')
const {
  records: items,
  error,
  feedback,
  isLoading,
  load,
  applySavedFlash,
  remove,
} = useManagementList<ServiceItem>({
  async loadRecords() {
    const [nextItems, nextCategories] = await Promise.all([fetchItems(), fetchCategories()])
    categories.value = nextCategories
    return nextItems
  },
  deleteRecord: deleteItem,
  loadErrorMessage: '加载服务失败',
  deleteErrorMessage: '删除服务失败',
  deleteSuccessMessage: '服务已删除',
  savedMessages: {
    created: '服务已创建',
    updated: '服务已保存',
  },
})
const selectedCategoryId = ref('')
const selectedStatus = ref('')
const selectedTagId = ref('')
const areMobileFiltersOpen = ref(false)
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
  return items.value.filter((item) =>
    matchesSearchQuery(query.value, [
        item.name,
        item.description ?? '',
        item.credentialHint ?? '',
        categoryById.value.get(item.categoryId ?? '') ?? '',
        ...item.tags.map((tag) => tag.name),
        ...item.endpoints.map((endpoint) => `${endpoint.label} ${endpoint.url} ${endpoint.kind}`),
      ]) &&
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

function rowStateClass(status: ServiceItem['status']) {
  if (status === 'hidden') {
    return 'opacity-75'
  }

  if (status === 'archived') {
    return 'opacity-60'
  }

  return ''
}

function clearFilters() {
  query.value = ''
  selectedCategoryId.value = ''
  selectedStatus.value = ''
  selectedTagId.value = ''
}

function toggleMobileFilters() {
  areMobileFiltersOpen.value = !areMobileFiltersOpen.value
}

onMounted(() => {
  applySavedFlash(route.query.saved)
  void load()
})

watch(
  () => route.fullPath,
  () => {
    const hasSavedFlash = applySavedFlash(route.query.saved)

    if (!hasEditor.value && hasSavedFlash) {
      void load()
    }
  },
)
</script>

<template>
  <main class="dm-page-grid">
    <div :class="hasEditor ? 'hidden md:grid md:gap-[var(--dm-section-gap)]' : 'dm-page-grid'">
      <PageHeader title="服务" description="管理自部署服务、访问地址、标签和 Vaultwarden 搜索提示。">
        <template #actions>
          <AppLinkButton to="/services/new" tone="primary">新建服务</AppLinkButton>
        </template>
      </PageHeader>

      <section class="grid gap-3">
        <div class="grid gap-3 md:grid-cols-[minmax(14rem,2fr)_minmax(9rem,1fr)_minmax(9rem,1fr)_minmax(9rem,1fr)_auto] md:items-center">
          <SearchInput v-model="query" label="搜索服务" name="services-search" placeholder="搜索服务、URL、分类或标签" />

          <div class="hidden md:contents">
            <AppSelect v-model="selectedCategoryId" aria-label="按分类筛选服务" name="services-category-filter">
              <option value="">全部分类</option>
              <option value="__uncategorized">未分类</option>
              <option v-for="category in categories" :key="category.id" :value="category.id">{{ category.name }}</option>
            </AppSelect>
            <AppSelect v-model="selectedStatus" aria-label="按状态筛选服务" name="services-status-filter">
              <option value="">全部状态</option>
              <option v-for="(label, value) in statusLabels" :key="value" :value="value">{{ label }}</option>
            </AppSelect>
            <AppSelect v-model="selectedTagId" aria-label="按标签筛选服务" name="services-tag-filter">
              <option value="">全部标签</option>
              <option v-for="tag in availableTags" :key="tag.id" :value="tag.id">{{ tag.name }}</option>
            </AppSelect>
            <AppButton class="justify-self-start" :disabled="!hasFilters" tone="ghost" type="button" @click="clearFilters">清空</AppButton>
          </div>

          <Transition name="dm-collapse">
            <div v-if="areMobileFiltersOpen" class="grid gap-3 md:hidden">
              <AppSelect v-model="selectedCategoryId" aria-label="按分类筛选服务" name="services-category-filter-mobile">
                <option value="">全部分类</option>
                <option value="__uncategorized">未分类</option>
                <option v-for="category in categories" :key="category.id" :value="category.id">{{ category.name }}</option>
              </AppSelect>
              <AppSelect v-model="selectedStatus" aria-label="按状态筛选服务" name="services-status-filter-mobile">
                <option value="">全部状态</option>
                <option v-for="(label, value) in statusLabels" :key="value" :value="value">{{ label }}</option>
              </AppSelect>
              <AppSelect v-model="selectedTagId" aria-label="按标签筛选服务" name="services-tag-filter-mobile">
                <option value="">全部标签</option>
                <option v-for="tag in availableTags" :key="tag.id" :value="tag.id">{{ tag.name }}</option>
              </AppSelect>
            </div>
          </Transition>

          <div class="flex items-center justify-between gap-2 md:hidden">
            <AppButton tone="secondary" type="button" @click="toggleMobileFilters">
              {{ areMobileFiltersOpen ? '收起筛选' : '筛选' }}
            </AppButton>
            <AppButton v-if="hasFilters" tone="ghost" type="button" @click="clearFilters">清空筛选</AppButton>
          </div>
        </div>
      </section>
      <FeedbackMessage tone="success" :message="feedback" />
      <FeedbackMessage tone="error" :message="error" />

      <section v-if="isLoading" class="dm-surface p-[var(--dm-panel-padding)] text-sm text-[var(--dm-text-muted)]">
        正在加载服务...
      </section>

      <section v-else-if="filteredItems.length === 0" class="dm-surface p-8 text-center">
        <p class="text-base font-medium text-[var(--dm-text)]">{{ hasFilters ? '没有符合筛选条件的服务' : '还没有服务' }}</p>
        <p class="mt-1 text-sm text-[var(--dm-text-muted)]">{{ hasFilters ? '清空筛选或换一个条件试试。' : '可以新建服务，开始整理自部署入口。' }}</p>
        <div class="mt-4 flex justify-center gap-2">
          <AppButton v-if="hasFilters" type="button" @click="clearFilters">清空筛选</AppButton>
          <AppLinkButton to="/services/new" tone="primary">新建服务</AppLinkButton>
        </div>
      </section>

      <section v-else>
        <div class="dm-list-shell hidden lg:block">
          <table class="w-full table-fixed text-left text-sm">
            <colgroup>
              <col class="w-[27%]" />
              <col class="w-[22%]" />
              <col class="w-[15%]" />
              <col class="w-[18%]" />
              <col class="w-[18%]" />
            </colgroup>
            <thead class="dm-list-head text-xs font-medium">
              <tr>
                <th class="px-3 py-3 font-medium">服务</th>
                <th class="px-3 py-3 font-medium">主地址</th>
                <th class="px-3 py-3 font-medium">标签</th>
                <th class="px-3 py-3 font-medium">凭据与地址</th>
                <th class="px-3 py-3 text-right font-medium">操作</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[var(--dm-border)]">
              <tr v-for="row in serviceRows" :key="row.item.id" :class="['dm-list-row', rowStateClass(row.item.status)]">
                <td class="px-3 py-3 align-middle">
                  <div class="flex min-w-0 items-center gap-3">
                    <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--dm-radius-control)] bg-[var(--dm-surface-muted)] text-base font-semibold text-[var(--dm-text-muted)]">
                      {{ row.item.icon || '•' }}
                    </span>
                    <div class="min-w-0">
                      <div class="flex min-w-0 items-center gap-2">
                        <p class="truncate font-semibold text-[var(--dm-text)]">{{ row.item.name }}</p>
                        <span :class="['shrink-0 rounded-[var(--dm-radius-full)] px-2 py-0.5 text-xs font-medium', statusToneClasses[row.item.status]]">
                          {{ statusLabels[row.item.status] }}
                        </span>
                      </div>
                      <p class="mt-1 truncate text-xs text-[var(--dm-text-subtle)]">{{ row.categoryName }}</p>
                      <p v-if="row.item.description" class="mt-1 truncate text-xs text-[var(--dm-text-subtle)]">{{ row.item.description }}</p>
                    </div>
                  </div>
                </td>
                <td class="px-3 py-3 align-middle">
                  <template v-if="row.primaryEndpoint">
                    <a class="dm-link block truncate" :href="row.primaryEndpoint.url" target="_blank">
                      {{ row.primaryEndpoint.label }} · {{ endpointKindLabels[row.primaryEndpoint.kind] }}
                    </a>
                    <p class="mt-1 truncate text-xs text-[var(--dm-text-subtle)]">{{ row.primaryEndpoint.url }}</p>
                  </template>
                  <span v-else class="text-sm text-[var(--dm-text-subtle)]">未配置地址</span>
                </td>
                <td class="px-3 py-3 align-middle">
                  <div v-if="row.visibleTags.length > 0" class="flex flex-wrap gap-1.5">
                    <AppBadge v-for="tag in row.visibleTags" :key="tag.id">{{ tag.name }}</AppBadge>
                    <AppBadge v-if="row.hiddenTagCount > 0">+{{ row.hiddenTagCount }}</AppBadge>
                  </div>
                  <span v-else class="text-sm text-[var(--dm-text-subtle)]">无标签</span>
                </td>
                <td class="px-3 py-3 align-middle">
                  <p
                    :class="[
                      'truncate text-sm',
                      row.item.credentialHint ? 'text-[var(--dm-text-muted)]' : 'text-[var(--dm-text-subtle)]',
                    ]"
                  >
                    {{ row.item.credentialHint || '未设置凭据提示' }}
                  </p>
                  <p class="mt-1 text-xs text-[var(--dm-text-subtle)]">{{ row.item.endpoints.length }} 个地址</p>
                </td>
                <td class="px-3 py-3 align-middle">
                  <div class="flex items-center justify-end gap-1 whitespace-nowrap">
                    <a
                      v-if="row.primaryEndpoint"
                      class="inline-flex min-h-8 items-center justify-center rounded-[var(--dm-radius-control)] px-2.5 py-1 text-sm font-medium text-[var(--dm-text-muted)] transition hover:bg-[var(--dm-surface-muted)] hover:text-[var(--dm-text)]"
                      :href="row.primaryEndpoint.url"
                      target="_blank"
                    >
                      打开 ↗
                    </a>
                    <AppLinkButton :to="`/services/${row.item.id}/edit`" tone="ghost" size="sm">编辑</AppLinkButton>
                    <ConfirmAction :message="`确认删除服务“${row.item.name}”？`" size="sm" @confirm="remove(row.item.id)" />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="grid gap-2 lg:hidden">
          <article v-for="row in serviceRows" :key="row.item.id" :class="['dm-mobile-card', rowStateClass(row.item.status)]">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <div class="flex min-w-0 items-center gap-2">
                  <p class="truncate text-base font-semibold text-[var(--dm-text)]">{{ row.item.icon || '•' }} {{ row.item.name }}</p>
                  <span :class="['shrink-0 rounded-[var(--dm-radius-full)] px-2 py-0.5 text-xs font-medium', statusToneClasses[row.item.status]]">
                    {{ statusLabels[row.item.status] }}
                  </span>
                </div>
                <p class="mt-1 text-sm text-[var(--dm-text-muted)]">{{ row.categoryName }}</p>
              </div>
            </div>

            <p v-if="row.item.description" class="mt-3 text-sm leading-6 text-[var(--dm-text-muted)]">{{ row.item.description }}</p>

            <div class="mt-3">
              <a
                v-if="row.primaryEndpoint"
                :href="row.primaryEndpoint.url"
                class="dm-link break-all text-sm"
                target="_blank"
              >
                {{ row.primaryEndpoint.label }} · {{ endpointKindLabels[row.primaryEndpoint.kind] }}
              </a>
              <p v-else class="text-sm text-[var(--dm-text-muted)]">未配置地址</p>
            </div>

            <p v-if="row.item.credentialHint" class="mt-3 rounded-[var(--dm-radius-control)] bg-[var(--dm-surface-muted)] px-3 py-2 text-xs text-[var(--dm-text-muted)]">
              {{ row.item.credentialHint }}
            </p>

            <div v-if="row.visibleTags.length > 0" class="mt-3 flex flex-wrap gap-2">
              <AppBadge v-for="tag in row.visibleTags" :key="tag.id">{{ tag.name }}</AppBadge>
              <AppBadge v-if="row.hiddenTagCount > 0">+{{ row.hiddenTagCount }}</AppBadge>
            </div>

            <div class="mt-4 flex flex-wrap items-center justify-between gap-2">
              <span class="text-xs text-[var(--dm-text-subtle)]">{{ row.item.endpoints.length }} 个地址</span>
              <div class="flex flex-wrap gap-2">
                <a
                  v-if="row.primaryEndpoint"
                  class="inline-flex min-h-10 items-center justify-center rounded-[var(--dm-radius-control)] px-3.5 py-2 text-sm font-medium text-[var(--dm-primary)] transition hover:bg-[var(--dm-primary-soft)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--dm-focus)]"
                  :href="row.primaryEndpoint.url"
                  target="_blank"
                >
                  打开
                </a>
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
