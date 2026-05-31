<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterView, useRoute } from 'vue-router'

import type { Tag } from '@dockmark/shared'

import { deleteTag, fetchTags } from '../api/client'
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
  records: tags,
  error,
  feedback,
  isLoading,
  load,
  applySavedFlash,
  remove,
} = useManagementList<Tag>({
  loadRecords: fetchTags,
  deleteRecord: deleteTag,
  loadErrorMessage: '加载标签失败',
  deleteErrorMessage: '删除标签失败',
  deleteSuccessMessage: '标签已删除',
  savedMessages: {
    created: '标签已创建',
    updated: '标签已保存',
  },
})
const hasEditor = computed(() => route.name === 'tag-new' || route.name === 'tag-edit')
const filteredTags = computed(() => tags.value.filter((tag) => matchesSearchQuery(query.value, [tag.name, tag.slug])))

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
      <PageHeader title="标签" description="用标签补充分组维度，便于搜索服务用途、位置和访问方式。">
        <template #actions>
          <AppLinkButton to="/tags/new" tone="primary">新建标签</AppLinkButton>
        </template>
      </PageHeader>

      <FeedbackMessage tone="success" :message="feedback" />
      <FeedbackMessage tone="error" :message="error" />

      <section class="md:max-w-sm">
        <SearchInput v-model="query" label="搜索标签" name="tags-search" placeholder="搜索标签或 Slug" />
      </section>

      <section v-if="isLoading" class="dm-surface p-[var(--dm-panel-padding)] text-sm text-[var(--dm-text-muted)]">
        正在加载标签...
      </section>

      <section v-else-if="tags.length === 0" class="dm-surface p-8 text-center">
        <p class="text-base font-medium text-[var(--dm-text)]">还没有标签</p>
        <p class="mt-1 text-sm text-[var(--dm-text-muted)]">标签适合标记媒体、监控、内网、生产等服务属性。</p>
      </section>

      <section v-else-if="filteredTags.length === 0" class="dm-surface p-8 text-center">
        <p class="text-base font-medium text-[var(--dm-text)]">没有符合搜索条件的标签</p>
        <p class="mt-1 text-sm text-[var(--dm-text-muted)]">清空搜索或换一个关键词试试。</p>
      </section>

      <section v-else>
        <div class="dm-list-shell hidden md:block">
          <div class="dm-list-head grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_10rem] px-4 py-3 text-xs font-medium">
            <span>标签</span>
            <span>Slug</span>
            <span class="text-right">操作</span>
          </div>
          <TransitionGroup class="divide-y divide-[var(--dm-border)]" name="dm-list-fade" tag="div">
            <article
              v-for="tag in filteredTags"
              :key="tag.id"
              class="dm-list-row grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_10rem] items-center px-4 py-3"
            >
              <p class="truncate font-semibold text-[var(--dm-text)]">{{ tag.name }}</p>
              <p class="truncate text-sm text-[var(--dm-text-muted)]">{{ tag.slug }}</p>
              <div class="flex items-center justify-end gap-1">
                <AppLinkButton :to="`/tags/${tag.id}/edit`" tone="ghost">编辑</AppLinkButton>
                <ConfirmAction :message="`确认删除标签“${tag.name}”？`" @confirm="remove(tag.id)" />
              </div>
            </article>
          </TransitionGroup>
        </div>

        <TransitionGroup class="grid gap-2 md:hidden" name="dm-list-fade" tag="div">
          <article v-for="tag in filteredTags" :key="tag.id" class="dm-mobile-card">
            <p class="text-base font-semibold text-[var(--dm-text)]">{{ tag.name }}</p>
            <p class="mt-1 break-all text-sm text-[var(--dm-text-muted)]">{{ tag.slug }}</p>
            <div class="mt-4 flex flex-wrap gap-2">
              <AppLinkButton :to="`/tags/${tag.id}/edit`" tone="ghost">编辑</AppLinkButton>
              <ConfirmAction :message="`确认删除标签“${tag.name}”？`" @confirm="remove(tag.id)" />
            </div>
          </article>
        </TransitionGroup>
      </section>
    </div>

    <RouterView />
  </main>
</template>
