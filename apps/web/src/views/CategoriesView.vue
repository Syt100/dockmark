<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterView, useRoute } from 'vue-router'

import type { Category } from '@dockmark/shared'

import { deleteCategory, fetchCategories } from '../api/client'
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
    error.value = caught instanceof Error ? caught.message : '加载分类失败'
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
    error.value = caught instanceof Error ? caught.message : '删除分类失败'
  }
}

onMounted(load)
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

      <section v-if="isLoading" class="rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-sm">
        正在加载分类...
      </section>

      <section v-else-if="categories.length === 0" class="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
        <p class="text-base font-medium text-slate-950">还没有分类</p>
        <p class="mt-1 text-sm text-slate-600">创建分类后，服务可以按区域、用途或系统分组。</p>
      </section>

      <section v-else class="grid gap-3 md:grid-cols-2">
        <article v-for="category in categories" :key="category.id" class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div class="flex items-start justify-between gap-4">
            <div class="min-w-0">
              <p class="text-lg font-semibold text-slate-950">{{ category.icon || '•' }} {{ category.name }}</p>
              <p class="mt-1 text-sm text-slate-600">{{ category.slug }}</p>
              <div class="mt-3 flex flex-wrap gap-2 text-xs text-slate-600">
                <span class="rounded-md bg-slate-100 px-2 py-1">排序 {{ category.sortOrder }}</span>
                <span v-if="category.color" class="rounded-md bg-slate-100 px-2 py-1">{{ category.color }}</span>
              </div>
            </div>
          </div>
          <div class="mt-4 flex flex-wrap gap-2">
            <AppLinkButton :to="`/categories/${category.id}/edit`">编辑</AppLinkButton>
            <ConfirmAction message="确认删除这个分类？服务会变为未分类。" @confirm="remove(category.id)" />
          </div>
        </article>
      </section>
    </div>

    <RouterView @vue:unmounted="load" />
  </main>
</template>
