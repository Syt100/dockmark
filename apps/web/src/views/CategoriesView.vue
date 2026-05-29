<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterView, useRoute } from 'vue-router'

import type { Category } from '@dockmark/shared'

import { deleteCategory, fetchCategories } from '../api/client'
import { toChineseError } from '../api/errors'
import AppLinkButton from '../components/AppLinkButton.vue'
import ConfirmAction from '../components/ConfirmAction.vue'
import FeedbackMessage from '../components/FeedbackMessage.vue'
import PageHeader from '../components/PageHeader.vue'

const route = useRoute()
const categories = ref<Category[]>([])
const error = ref<string | null>(null)
const feedback = ref<string | null>(null)
const isLoading = ref(false)
const hasEditor = computed(() => route.name === 'category-new' || route.name === 'category-edit')

async function load() {
  isLoading.value = true
  error.value = null

  try {
    categories.value = await fetchCategories()
  } catch (caught) {
    error.value = toChineseError(caught, '加载分类失败')
  } finally {
    isLoading.value = false
  }
}

async function remove(id: string) {
  error.value = null
  feedback.value = null

  try {
    await deleteCategory(id)
    feedback.value = '分类已删除'
    await load()
  } catch (caught) {
    error.value = toChineseError(caught, '删除分类失败')
  }
}

function applyFlash(value: unknown) {
  if (value === 'created') {
    feedback.value = '分类已创建'
  } else if (value === 'updated') {
    feedback.value = '分类已保存'
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
      <PageHeader title="分类" description="用分类组织首页服务入口，排序值越小越靠前。">
        <template #actions>
          <AppLinkButton to="/categories/new" tone="primary">新建分类</AppLinkButton>
        </template>
      </PageHeader>

      <FeedbackMessage tone="success" :message="feedback" />
      <FeedbackMessage tone="error" :message="error" />

      <section v-if="isLoading" class="rounded-lg bg-white p-5 text-sm text-slate-600">
        正在加载分类...
      </section>

      <section v-else-if="categories.length === 0" class="rounded-lg bg-white p-8 text-center">
        <p class="text-base font-medium text-slate-950">还没有分类</p>
        <p class="mt-1 text-sm text-slate-600">创建分类后，服务可以按区域、用途或系统分组。</p>
      </section>

      <section v-else>
        <div class="hidden overflow-hidden rounded-lg bg-white md:block">
          <div class="grid grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_8rem_10rem] bg-slate-50 px-4 py-3 text-xs font-medium text-slate-500">
            <span>分类</span>
            <span>Slug</span>
            <span>排序</span>
            <span class="text-right">操作</span>
          </div>
          <div class="divide-y divide-slate-100">
            <article
              v-for="category in categories"
              :key="category.id"
              class="grid grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_8rem_10rem] items-center px-4 py-3 transition hover:bg-blue-50/60"
            >
              <div class="flex min-w-0 items-center gap-3">
                <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-slate-100 text-base font-semibold text-slate-700">
                  {{ category.icon || '•' }}
                </span>
                <div class="min-w-0">
                  <p class="truncate font-semibold text-slate-950">{{ category.name }}</p>
                  <p v-if="category.color" class="mt-1 truncate text-xs text-slate-500">{{ category.color }}</p>
                </div>
              </div>
              <p class="truncate text-sm text-slate-600">{{ category.slug }}</p>
              <p class="text-sm text-slate-600">{{ category.sortOrder }}</p>
              <div class="flex items-center justify-end gap-1">
                <AppLinkButton :to="`/categories/${category.id}/edit`" tone="ghost">编辑</AppLinkButton>
                <ConfirmAction :message="`确认删除分类“${category.name}”？服务会变为未分类。`" @confirm="remove(category.id)" />
              </div>
            </article>
          </div>
        </div>

        <div class="grid gap-2 md:hidden">
          <article v-for="category in categories" :key="category.id" class="rounded-lg bg-white p-4 transition hover:bg-blue-50/60">
            <div class="flex items-start justify-between gap-4">
              <div class="min-w-0">
                <p class="text-base font-semibold text-slate-950">{{ category.icon || '•' }} {{ category.name }}</p>
                <p class="mt-1 break-all text-sm text-slate-600">{{ category.slug }}</p>
                <div class="mt-3 flex flex-wrap gap-2 text-xs text-slate-600">
                  <span class="rounded-md bg-slate-100 px-2 py-1">排序 {{ category.sortOrder }}</span>
                  <span v-if="category.color" class="rounded-md bg-slate-100 px-2 py-1">{{ category.color }}</span>
                </div>
              </div>
            </div>
            <div class="mt-4 flex flex-wrap gap-2">
              <AppLinkButton :to="`/categories/${category.id}/edit`" tone="ghost">编辑</AppLinkButton>
              <ConfirmAction :message="`确认删除分类“${category.name}”？服务会变为未分类。`" @confirm="remove(category.id)" />
            </div>
          </article>
        </div>
      </section>
    </div>

    <RouterView />
  </main>
</template>
