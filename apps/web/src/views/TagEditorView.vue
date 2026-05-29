<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { createTag, fetchTags, updateTag } from '../api/client'
import { toChineseError } from '../api/errors'
import AppButton from '../components/AppButton.vue'
import FeedbackMessage from '../components/FeedbackMessage.vue'
import ResponsiveEditorShell from '../components/ResponsiveEditorShell.vue'

const route = useRoute()
const router = useRouter()
const error = ref<string | null>(null)
const isLoading = ref(false)
const isSaving = ref(false)
const tagId = computed(() => (typeof route.params.id === 'string' ? route.params.id : null))
const isEditing = computed(() => tagId.value !== null)

const form = reactive({
  name: '',
  slug: '',
})

async function load() {
  if (!tagId.value) {
    return
  }

  isLoading.value = true
  error.value = null

  try {
    const tag = (await fetchTags()).find((entry) => entry.id === tagId.value)

    if (!tag) {
      error.value = '标签不存在'
      return
    }

    form.name = tag.name
    form.slug = tag.slug
  } catch (caught) {
    error.value = toChineseError(caught, '加载标签失败')
  } finally {
    isLoading.value = false
  }
}

async function submit() {
  isSaving.value = true
  error.value = null

  try {
    const input = {
      name: form.name,
      slug: form.slug || undefined,
    }

    if (tagId.value) {
      await updateTag(tagId.value, input)
      await router.push({ path: '/tags', query: { saved: 'updated' } })
    } else {
      await createTag(input)
      await router.push({ path: '/tags', query: { saved: 'created' } })
    }
  } catch (caught) {
    error.value = toChineseError(caught, '保存标签失败')
  } finally {
    isSaving.value = false
  }
}

onMounted(load)
</script>

<template>
  <ResponsiveEditorShell :title="isEditing ? '编辑标签' : '新建标签'" back-to="/tags">
    <form class="grid gap-5" @submit.prevent="submit">
      <FeedbackMessage tone="error" :message="error" />

      <div v-if="isLoading" class="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
        正在加载标签...
      </div>

      <template v-else>
        <div class="grid gap-4">
          <label class="grid gap-1 text-sm">
            <span class="font-medium text-slate-700">标签名称</span>
            <input v-model="form.name" class="rounded-md border border-slate-300 px-3 py-2" required />
          </label>
          <label class="grid gap-1 text-sm">
            <span class="font-medium text-slate-700">Slug</span>
            <input v-model="form.slug" class="rounded-md border border-slate-300 px-3 py-2" placeholder="留空则自动生成" />
          </label>
        </div>

        <div class="flex flex-col-reverse gap-2 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">
          <AppButton type="button" @click="router.push('/tags')">取消</AppButton>
          <AppButton tone="primary" type="submit" :disabled="isSaving">
            {{ isSaving ? '保存中...' : '保存标签' }}
          </AppButton>
        </div>
      </template>
    </form>
  </ResponsiveEditorShell>
</template>
