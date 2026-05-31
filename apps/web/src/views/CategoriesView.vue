<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterView, useRoute } from 'vue-router'

import type { Category } from '@dockmark/shared'

import { deleteCategory, fetchCategories } from '../api/client'
import AppBadge from '../components/AppBadge.vue'
import AppLinkButton from '../components/AppLinkButton.vue'
import ConfirmAction from '../components/ConfirmAction.vue'
import FeedbackMessage from '../components/FeedbackMessage.vue'
import PageHeader from '../components/PageHeader.vue'
import SearchInput from '../components/SearchInput.vue'
import { useManagementList } from '../composables/managementList'
import { matchesSearchQuery } from '../ui/search'

const route = useRoute()
const query = ref('')
const {
  records: categories,
  error,
  feedback,
  isLoading,
  load,
  applySavedFlash,
  remove,
} = useManagementList<Category>({
  loadRecords: fetchCategories,
  deleteRecord: deleteCategory,
  loadErrorMessage: '加载分类失败',
  deleteErrorMessage: '删除分类失败',
  deleteSuccessMessage: '分类已删除',
  savedMessages: {
    created: '分类已创建',
    updated: '分类已保存',
  },
})
const hasEditor = computed(() => route.name === 'category-new' || route.name === 'category-edit')
const filteredCategories = computed(() =>
  categories.value.filter((category) =>
    matchesSearchQuery(query.value, [category.name, category.slug, category.icon, category.color, String(category.sortOrder)]),
  ),
)

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
      <PageHeader title="分类" description="用分类组织首页服务入口，排序值越小越靠前。">
        <template #actions>
          <AppLinkButton to="/categories/new" tone="primary">新建分类</AppLinkButton>
        </template>
      </PageHeader>

      <FeedbackMessage tone="success" :message="feedback" />
      <FeedbackMessage tone="error" :message="error" />

      <section class="md:max-w-sm">
        <SearchInput v-model="query" label="搜索分类" name="categories-search" placeholder="搜索分类、Slug 或颜色" />
      </section>

      <section v-if="isLoading" class="dm-surface p-[var(--dm-panel-padding)] text-sm text-[var(--dm-text-muted)]">
        正在加载分类...
      </section>

      <section v-else-if="categories.length === 0" class="dm-surface p-8 text-center">
        <p class="text-base font-medium text-[var(--dm-text)]">还没有分类</p>
        <p class="mt-1 text-sm text-[var(--dm-text-muted)]">创建分类后，服务可以按区域、用途或系统分组。</p>
      </section>

      <section v-else-if="filteredCategories.length === 0" class="dm-surface p-8 text-center">
        <p class="text-base font-medium text-[var(--dm-text)]">没有符合搜索条件的分类</p>
        <p class="mt-1 text-sm text-[var(--dm-text-muted)]">清空搜索或换一个关键词试试。</p>
      </section>

      <section v-else>
        <div class="dm-list-shell hidden md:block">
          <div class="dm-list-head grid grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_8rem_10rem] px-4 py-3 text-xs font-medium">
            <span>分类</span>
            <span>Slug</span>
            <span>排序</span>
            <span class="text-right">操作</span>
          </div>
          <TransitionGroup class="divide-y divide-[var(--dm-border)]" name="dm-list" tag="div">
            <article
              v-for="category in filteredCategories"
              :key="category.id"
              class="dm-list-row grid grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_8rem_10rem] items-center px-4 py-3"
            >
              <div class="flex min-w-0 items-center gap-3">
                <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--dm-radius-control)] bg-[var(--dm-surface-muted)] text-base font-semibold text-[var(--dm-text-muted)]">
                  {{ category.icon || '•' }}
                </span>
                <div class="min-w-0">
                  <p class="truncate font-semibold text-[var(--dm-text)]">{{ category.name }}</p>
                  <p v-if="category.color" class="mt-1 truncate text-xs text-[var(--dm-text-subtle)]">{{ category.color }}</p>
                </div>
              </div>
              <p class="truncate text-sm text-[var(--dm-text-muted)]">{{ category.slug }}</p>
              <p class="text-sm text-[var(--dm-text-muted)]">{{ category.sortOrder }}</p>
              <div class="flex items-center justify-end gap-1">
                <AppLinkButton :to="`/categories/${category.id}/edit`" tone="ghost">编辑</AppLinkButton>
                <ConfirmAction :message="`确认删除分类“${category.name}”？服务会变为未分类。`" @confirm="remove(category.id)" />
              </div>
            </article>
          </TransitionGroup>
        </div>

        <TransitionGroup class="grid gap-2 md:hidden" name="dm-list" tag="div">
          <article v-for="category in filteredCategories" :key="category.id" class="dm-mobile-card">
            <div class="flex items-start justify-between gap-4">
              <div class="min-w-0">
                <p class="text-base font-semibold text-[var(--dm-text)]">{{ category.icon || '•' }} {{ category.name }}</p>
                <p class="mt-1 break-all text-sm text-[var(--dm-text-muted)]">{{ category.slug }}</p>
                <div class="mt-3 flex flex-wrap gap-2">
                  <AppBadge>排序 {{ category.sortOrder }}</AppBadge>
                  <AppBadge v-if="category.color">{{ category.color }}</AppBadge>
                </div>
              </div>
            </div>
            <div class="mt-4 flex flex-wrap gap-2">
              <AppLinkButton :to="`/categories/${category.id}/edit`" tone="ghost">编辑</AppLinkButton>
              <ConfirmAction :message="`确认删除分类“${category.name}”？服务会变为未分类。`" @confirm="remove(category.id)" />
            </div>
          </article>
        </TransitionGroup>
      </section>
    </div>

    <RouterView />
  </main>
</template>
