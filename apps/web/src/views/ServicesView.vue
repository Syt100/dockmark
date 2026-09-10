<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterView, useRoute, useRouter } from 'vue-router'

import type { Category, ServiceItem } from '@dockmark/shared'

import { deleteItem, fetchCategories, fetchItems } from '../api/client'
import AppBadge from '../components/AppBadge.vue'
import AppButton from '../components/AppButton.vue'
import AppIconButton from '../components/AppIconButton.vue'
import AppLinkButton from '../components/AppLinkButton.vue'
import AppSelect from '../components/AppSelect.vue'
import ConfirmAction from '../components/ConfirmAction.vue'
import FeedbackMessage from '../components/FeedbackMessage.vue'
import ListLoadingSkeleton from '../components/ListLoadingSkeleton.vue'
import PageHeader from '../components/PageHeader.vue'
import RefreshIndicator from '../components/RefreshIndicator.vue'
import SearchInput from '../components/SearchInput.vue'
import ServiceIcon from '../components/ServiceIcon.vue'
import ServiceNavCard from '../components/ServiceNavCard.vue'
import { useManagementList } from '../composables/managementList'
import { endpointKindLabels, statusLabels, statusToneClasses } from '../ui/labels'
import { matchesSearchQuery } from '../ui/search'

type ServiceViewMode = 'cards' | 'list'

type ServiceRow = {
  item: ServiceItem
  categoryName: string
  primaryEndpoint: ServiceItem['endpoints'][number] | null
  visibleTags: ServiceItem['tags']
  hiddenTagCount: number
}

type ServiceCardGroup = {
  id: string
  name: string
  icon: string | null
  items: ServiceItem[]
}

const route = useRoute()
const router = useRouter()
const categories = ref<Category[]>([])
const query = ref('')
const selectedCategoryId = ref('')
const selectedStatus = ref('')
const selectedTagId = ref('')
const areFiltersOpen = ref(false)

const {
  records: items,
  error,
  feedback,
  isLoading,
  isRefreshing,
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

const hasEditor = computed(() => route.name === 'service-new' || route.name === 'service-edit')
const viewMode = computed<ServiceViewMode>(() => (route.query.view === 'list' ? 'list' : 'cards'))
const hasFilters = computed(
  () =>
    query.value.trim().length > 0 ||
    selectedCategoryId.value !== '' ||
    selectedStatus.value !== '' ||
    selectedTagId.value !== '',
)
const categoryById = computed(
  () => new Map(categories.value.map((category) => [category.id, category.name])),
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

const filteredItems = computed(() =>
  items.value.filter(
    (item) =>
      matchesSearchQuery(query.value, [
        item.name,
        item.description ?? '',
        item.credentialHint ?? '',
        categoryById.value.get(item.categoryId ?? '') ?? '',
        ...item.tags.map((tag) => tag.name),
        ...item.endpoints.map((endpoint) => `${endpoint.label} ${endpoint.url} ${endpoint.kind}`),
      ]) &&
      (!selectedCategoryId.value ||
        (selectedCategoryId.value === '__uncategorized'
          ? item.categoryId === null
          : item.categoryId === selectedCategoryId.value)) &&
      (!selectedStatus.value || item.status === selectedStatus.value) &&
      (!selectedTagId.value || item.tags.some((tag) => tag.id === selectedTagId.value)),
  ),
)

const cardGroups = computed<ServiceCardGroup[]>(() => {
  const groups = categories.value
    .map((category) => ({
      id: category.id,
      name: category.name,
      icon: category.icon,
      items: filteredItems.value.filter((item) => item.categoryId === category.id),
    }))
    .filter((group) => group.items.length > 0)

  const uncategorized = filteredItems.value.filter((item) => item.categoryId === null)

  if (uncategorized.length > 0) {
    groups.push({
      id: '__uncategorized',
      name: '未分类',
      icon: null,
      items: uncategorized,
    })
  }

  return groups
})

const serviceRows = computed<ServiceRow[]>(() =>
  filteredItems.value.map((item) => ({
    item,
    categoryName: categoryById.value.get(item.categoryId ?? '') ?? '未分类',
    primaryEndpoint:
      item.endpoints.find((endpoint) => endpoint.isPrimary) ?? item.endpoints[0] ?? null,
    visibleTags: item.tags.slice(0, 3),
    hiddenTagCount: Math.max(item.tags.length - 3, 0),
  })),
)

const returnViewQuery = computed(() => (viewMode.value === 'list' ? { view: 'list' } : {}))
const newServiceTo = computed(() => ({
  path: '/services/new',
  query: returnViewQuery.value,
}))

function editorTo(id: string) {
  return {
    path: `/services/${id}/edit`,
    query: returnViewQuery.value,
  }
}

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

function toggleFilters() {
  areFiltersOpen.value = !areFiltersOpen.value
}

function setView(mode: ServiceViewMode) {
  const nextQuery = { ...route.query }
  delete nextQuery.saved

  if (mode === 'list') {
    nextQuery.view = 'list'
  } else {
    delete nextQuery.view
  }

  void router.replace({ path: '/services', query: nextQuery })
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
      <section class="grid">
        <PageHeader title="服务" description="用卡片快速打开服务，或切换列表视图进行集中管理。">
          <template #actions>
            <RefreshIndicator :active="isRefreshing" />

            <div
              class="inline-flex items-center rounded-[var(--dm-radius-control)] bg-[var(--dm-surface-muted)] p-1"
              role="group"
              aria-label="服务显示方式"
            >
              <AppIconButton
                label="卡片视图"
                :aria-pressed="viewMode === 'cards'"
                :class="
                  viewMode === 'cards'
                    ? 'bg-[var(--dm-surface)] text-[var(--dm-primary)] shadow-sm'
                    : undefined
                "
                @click="setView('cards')"
              >
                <svg aria-hidden="true" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M3 3h5v5H3V3Zm9 0h5v5h-5V3ZM3 12h5v5H3v-5Zm9 0h5v5h-5v-5Z" />
                </svg>
              </AppIconButton>
              <AppIconButton
                label="列表视图"
                :aria-pressed="viewMode === 'list'"
                :class="
                  viewMode === 'list'
                    ? 'bg-[var(--dm-surface)] text-[var(--dm-primary)] shadow-sm'
                    : undefined
                "
                @click="setView('list')"
              >
                <svg aria-hidden="true" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M3 4h14v2H3V4Zm0 5h14v2H3V9Zm0 5h14v2H3v-2Z" />
                </svg>
              </AppIconButton>
            </div>

            <AppIconButton
              class="relative"
              :label="areFiltersOpen ? '收起筛选' : '展开筛选'"
              :aria-expanded="areFiltersOpen"
              aria-controls="service-filters"
              @click="toggleFilters"
            >
              <svg
                aria-hidden="true"
                class="h-4 w-4"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M3 4h14l-5.5 6.2V15l-3 1.5v-6.3L3 4Z" />
              </svg>
              <span
                v-if="hasFilters"
                aria-hidden="true"
                class="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[var(--dm-primary)]"
              />
            </AppIconButton>

            <AppLinkButton :to="newServiceTo" tone="primary">新建服务</AppLinkButton>
          </template>
        </PageHeader>

        <div
          data-service-filter-collapse
          :data-state="areFiltersOpen ? 'open' : 'closed'"
          :class="[
            'grid transition-[grid-template-rows] duration-[var(--dm-motion-slow)] ease-[var(--dm-motion-ease)] motion-reduce:transition-none',
            areFiltersOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
          ]"
        >
          <div class="min-h-0 overflow-hidden" :inert="!areFiltersOpen">
            <section
              id="service-filters"
              class="dm-surface mt-[var(--dm-section-gap)] p-3 transition-opacity duration-[var(--dm-motion-base)] sm:p-4"
              :class="areFiltersOpen ? 'opacity-100' : 'opacity-0'"
              :aria-hidden="!areFiltersOpen"
            >
              <div
                class="grid gap-3 md:grid-cols-[minmax(14rem,2fr)_minmax(9rem,1fr)_minmax(9rem,1fr)_minmax(9rem,1fr)_auto] md:items-center"
              >
                <SearchInput
                  v-model="query"
                  label="搜索服务"
                  name="services-search"
                  placeholder="搜索服务、URL、分类或标签"
                />
                <AppSelect
                  v-model="selectedCategoryId"
                  aria-label="按分类筛选服务"
                  name="services-category-filter"
                >
                  <option value="">全部分类</option>
                  <option value="__uncategorized">未分类</option>
                  <option v-for="category in categories" :key="category.id" :value="category.id">
                    {{ category.name }}
                  </option>
                </AppSelect>
                <AppSelect
                  v-model="selectedStatus"
                  aria-label="按状态筛选服务"
                  name="services-status-filter"
                >
                  <option value="">全部状态</option>
                  <option v-for="(label, value) in statusLabels" :key="value" :value="value">
                    {{ label }}
                  </option>
                </AppSelect>
                <AppSelect
                  v-model="selectedTagId"
                  aria-label="按标签筛选服务"
                  name="services-tag-filter"
                >
                  <option value="">全部标签</option>
                  <option v-for="tag in availableTags" :key="tag.id" :value="tag.id">
                    {{ tag.name }}
                  </option>
                </AppSelect>
                <AppButton
                  class="justify-self-start"
                  :disabled="!hasFilters"
                  tone="ghost"
                  type="button"
                  @click="clearFilters"
                >
                  清空
                </AppButton>
              </div>
            </section>
          </div>
        </div>
      </section>

      <FeedbackMessage tone="success" :message="feedback" />
      <FeedbackMessage tone="error" :message="error" />

      <ListLoadingSkeleton v-if="isLoading" label="正在加载服务..." />

      <section v-else-if="filteredItems.length === 0" class="dm-surface p-8 text-center">
        <p class="text-base font-medium text-[var(--dm-text)]">
          {{ hasFilters ? '没有符合筛选条件的服务' : '还没有服务' }}
        </p>
        <p class="mt-1 text-sm text-[var(--dm-text-muted)]">
          {{
            hasFilters
              ? '展开筛选后可以清空条件或换一个条件试试。'
              : '可以新建服务，开始整理自部署入口。'
          }}
        </p>
        <div class="mt-4 flex justify-center gap-2">
          <AppButton v-if="hasFilters" type="button" @click="clearFilters">清空筛选</AppButton>
          <AppLinkButton :to="newServiceTo" tone="primary">新建服务</AppLinkButton>
        </div>
      </section>

      <template v-else-if="viewMode === 'cards'">
        <section v-for="group in cardGroups" :key="group.id" class="grid gap-3">
          <div class="flex items-center justify-between gap-3">
            <h2 class="text-lg font-semibold text-[var(--dm-text)]">
              {{ group.icon || '' }} {{ group.name }}
            </h2>
            <span class="text-xs text-[var(--dm-text-subtle)]">
              {{ group.items.length }} 个服务
            </span>
          </div>

          <TransitionGroup
            name="dm-list"
            tag="div"
            class="grid gap-3 md:grid-cols-2 xl:grid-cols-3"
          >
            <ServiceNavCard
              v-for="item in group.items"
              :key="item.id"
              :edit-to="editorTo(item.id)"
              :item="item"
            />
          </TransitionGroup>
        </section>
      </template>

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
            <TransitionGroup name="dm-list" tag="tbody" class="divide-y divide-[var(--dm-border)]">
              <tr
                v-for="row in serviceRows"
                :key="row.item.id"
                :class="['dm-list-row', rowStateClass(row.item.status)]"
              >
                <td class="px-3 py-3 align-middle">
                  <div class="flex min-w-0 items-center gap-3">
                    <ServiceIcon
                      :icon="row.item.icon"
                      :icon-type="row.item.iconType"
                      :name="row.item.name"
                      :primary-url="row.primaryEndpoint?.url ?? null"
                    />
                    <div class="min-w-0">
                      <div class="flex min-w-0 items-center gap-2">
                        <p class="truncate font-semibold text-[var(--dm-text)]">
                          {{ row.item.name }}
                        </p>
                        <span
                          :class="[
                            'shrink-0 rounded-[var(--dm-radius-full)] px-2 py-0.5 text-xs font-medium',
                            statusToneClasses[row.item.status],
                          ]"
                        >
                          {{ statusLabels[row.item.status] }}
                        </span>
                      </div>
                      <p class="mt-1 truncate text-xs text-[var(--dm-text-subtle)]">
                        {{ row.categoryName }}
                      </p>
                      <p
                        v-if="row.item.description"
                        class="mt-1 truncate text-xs text-[var(--dm-text-subtle)]"
                      >
                        {{ row.item.description }}
                      </p>
                    </div>
                  </div>
                </td>
                <td class="px-3 py-3 align-middle">
                  <template v-if="row.primaryEndpoint">
                    <a
                      class="dm-link block truncate"
                      :href="row.primaryEndpoint.url"
                      target="_blank"
                    >
                      {{ row.primaryEndpoint.label }} ·
                      {{ endpointKindLabels[row.primaryEndpoint.kind] }}
                    </a>
                    <p class="mt-1 truncate text-xs text-[var(--dm-text-subtle)]">
                      {{ row.primaryEndpoint.url }}
                    </p>
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
                      row.item.credentialHint
                        ? 'text-[var(--dm-text-muted)]'
                        : 'text-[var(--dm-text-subtle)]',
                    ]"
                  >
                    {{ row.item.credentialHint || '未设置凭据提示' }}
                  </p>
                  <p class="mt-1 text-xs text-[var(--dm-text-subtle)]">
                    {{ row.item.endpoints.length }} 个地址
                  </p>
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
                    <AppLinkButton :to="editorTo(row.item.id)" tone="ghost" size="sm">
                      编辑
                    </AppLinkButton>
                    <ConfirmAction
                      :message="`确认删除服务“${row.item.name}”？`"
                      size="sm"
                      @confirm="remove(row.item.id)"
                    />
                  </div>
                </td>
              </tr>
            </TransitionGroup>
          </table>
        </div>

        <TransitionGroup name="dm-list" tag="div" class="grid gap-2 lg:hidden">
          <article
            v-for="row in serviceRows"
            :key="row.item.id"
            :class="['dm-mobile-card', rowStateClass(row.item.status)]"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <div class="flex min-w-0 items-center gap-2">
                  <ServiceIcon
                    :icon="row.item.icon"
                    :icon-type="row.item.iconType"
                    :name="row.item.name"
                    :primary-url="row.primaryEndpoint?.url ?? null"
                    size="sm"
                  />
                  <p class="truncate text-base font-semibold text-[var(--dm-text)]">
                    {{ row.item.name }}
                  </p>
                  <span
                    :class="[
                      'shrink-0 rounded-[var(--dm-radius-full)] px-2 py-0.5 text-xs font-medium',
                      statusToneClasses[row.item.status],
                    ]"
                  >
                    {{ statusLabels[row.item.status] }}
                  </span>
                </div>
                <p class="mt-1 text-sm text-[var(--dm-text-muted)]">{{ row.categoryName }}</p>
              </div>
            </div>

            <p
              v-if="row.item.description"
              class="mt-3 text-sm leading-6 text-[var(--dm-text-muted)]"
            >
              {{ row.item.description }}
            </p>

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

            <p
              v-if="row.item.credentialHint"
              class="mt-3 rounded-[var(--dm-radius-control)] bg-[var(--dm-surface-muted)] px-3 py-2 text-xs text-[var(--dm-text-muted)]"
            >
              {{ row.item.credentialHint }}
            </p>

            <div v-if="row.visibleTags.length > 0" class="mt-3 flex flex-wrap gap-2">
              <AppBadge v-for="tag in row.visibleTags" :key="tag.id">{{ tag.name }}</AppBadge>
              <AppBadge v-if="row.hiddenTagCount > 0">+{{ row.hiddenTagCount }}</AppBadge>
            </div>

            <div class="mt-4 flex flex-wrap items-center justify-between gap-2">
              <span class="text-xs text-[var(--dm-text-subtle)]">
                {{ row.item.endpoints.length }} 个地址
              </span>
              <div class="flex flex-wrap gap-2">
                <a
                  v-if="row.primaryEndpoint"
                  class="inline-flex min-h-10 items-center justify-center rounded-[var(--dm-radius-control)] px-3.5 py-2 text-sm font-medium text-[var(--dm-primary)] transition hover:bg-[var(--dm-primary-soft)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--dm-focus)]"
                  :href="row.primaryEndpoint.url"
                  target="_blank"
                >
                  打开
                </a>
                <AppLinkButton :to="editorTo(row.item.id)" tone="ghost">编辑</AppLinkButton>
                <ConfirmAction
                  :message="`确认删除服务“${row.item.name}”？`"
                  @confirm="remove(row.item.id)"
                />
              </div>
            </div>
          </article>
        </TransitionGroup>
      </section>
    </div>

    <RouterView />
  </main>
</template>
