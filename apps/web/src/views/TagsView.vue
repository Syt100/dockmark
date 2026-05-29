<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterView, useRoute } from 'vue-router'

import type { Tag } from '@dockmark/shared'

import { deleteTag, fetchTags } from '../api/client'
import { toChineseError } from '../api/errors'
import AppLinkButton from '../components/AppLinkButton.vue'
import ConfirmAction from '../components/ConfirmAction.vue'
import FeedbackMessage from '../components/FeedbackMessage.vue'
import PageHeader from '../components/PageHeader.vue'

const route = useRoute()
const tags = ref<Tag[]>([])
const error = ref<string | null>(null)
const feedback = ref<string | null>(null)
const isLoading = ref(false)
const hasEditor = computed(() => route.name === 'tag-new' || route.name === 'tag-edit')

async function load() {
  isLoading.value = true
  error.value = null

  try {
    tags.value = await fetchTags()
  } catch (caught) {
    error.value = toChineseError(caught, '加载标签失败')
  } finally {
    isLoading.value = false
  }
}

async function remove(id: string) {
  error.value = null
  feedback.value = null

  try {
    await deleteTag(id)
    feedback.value = '标签已删除'
    await load()
  } catch (caught) {
    error.value = toChineseError(caught, '删除标签失败')
  }
}

function applyFlash(value: unknown) {
  if (value === 'created') {
    feedback.value = '标签已创建'
  } else if (value === 'updated') {
    feedback.value = '标签已保存'
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
      <PageHeader title="标签" description="用标签补充分组维度，便于搜索服务用途、位置和访问方式。">
        <template #actions>
          <AppLinkButton to="/tags/new" tone="primary">新建标签</AppLinkButton>
        </template>
      </PageHeader>

      <FeedbackMessage tone="success" :message="feedback" />
      <FeedbackMessage tone="error" :message="error" />

      <section v-if="isLoading" class="rounded-lg bg-white p-5 text-sm text-slate-600">
        正在加载标签...
      </section>

      <section v-else-if="tags.length === 0" class="rounded-lg bg-white p-8 text-center">
        <p class="text-base font-medium text-slate-950">还没有标签</p>
        <p class="mt-1 text-sm text-slate-600">标签适合标记媒体、监控、内网、生产等服务属性。</p>
      </section>

      <section v-else>
        <div class="hidden overflow-hidden rounded-lg bg-white md:block">
          <div class="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_10rem] bg-slate-50 px-4 py-3 text-xs font-medium text-slate-500">
            <span>标签</span>
            <span>Slug</span>
            <span class="text-right">操作</span>
          </div>
          <div class="divide-y divide-slate-100">
            <article
              v-for="tag in tags"
              :key="tag.id"
              class="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_10rem] items-center px-4 py-3 transition hover:bg-blue-50/60"
            >
              <p class="truncate font-semibold text-slate-950">{{ tag.name }}</p>
              <p class="truncate text-sm text-slate-600">{{ tag.slug }}</p>
              <div class="flex items-center justify-end gap-1">
                <AppLinkButton :to="`/tags/${tag.id}/edit`" tone="ghost">编辑</AppLinkButton>
                <ConfirmAction :message="`确认删除标签“${tag.name}”？`" @confirm="remove(tag.id)" />
              </div>
            </article>
          </div>
        </div>

        <div class="grid gap-2 md:hidden">
          <article v-for="tag in tags" :key="tag.id" class="rounded-lg bg-white p-4 transition hover:bg-blue-50/60">
            <p class="text-base font-semibold text-slate-950">{{ tag.name }}</p>
            <p class="mt-1 break-all text-sm text-slate-600">{{ tag.slug }}</p>
            <div class="mt-4 flex flex-wrap gap-2">
              <AppLinkButton :to="`/tags/${tag.id}/edit`" tone="ghost">编辑</AppLinkButton>
              <ConfirmAction :message="`确认删除标签“${tag.name}”？`" @confirm="remove(tag.id)" />
            </div>
          </article>
        </div>
      </section>
    </div>

    <RouterView />
  </main>
</template>
