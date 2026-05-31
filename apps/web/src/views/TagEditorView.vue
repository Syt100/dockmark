<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { createTag, fetchTag, updateTag } from '../api/client'
import { toChineseError } from '../api/errors'
import AppButton from '../components/AppButton.vue'
import EditorLoadingState from '../components/EditorLoadingState.vue'
import AppInput from '../components/AppInput.vue'
import FeedbackMessage from '../components/FeedbackMessage.vue'
import ResponsiveEditorShell from '../components/ResponsiveEditorShell.vue'
import { useMinimumVisibleLoading } from '../composables/minimumVisibleLoading'
import { tagFormToInput, tagToForm } from './managementForms'

const route = useRoute()
const router = useRouter()
const error = ref<string | null>(null)
const isLoading = ref(false)
const isSaving = ref(false)
const isLoadingVisible = useMinimumVisibleLoading(isLoading)
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
    Object.assign(form, tagToForm(await fetchTag(tagId.value)))
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
    const input = tagFormToInput(form)

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
    <form class="grid gap-[var(--dm-section-gap)]" @submit.prevent="submit">
      <FeedbackMessage tone="error" :message="error" />

      <EditorLoadingState v-if="isLoadingVisible" message="正在加载标签..." variant="tag" />

      <template v-else>
        <div class="grid gap-[var(--dm-form-gap)]">
          <label class="grid gap-1 text-sm">
            <span class="dm-label">标签名称</span>
            <AppInput v-model="form.name" required />
          </label>
          <label class="grid gap-1 text-sm">
            <span class="dm-label">Slug</span>
            <AppInput v-model="form.slug" placeholder="留空则自动生成" />
          </label>
        </div>

        <div class="flex flex-col-reverse gap-2 border-t border-[var(--dm-border)] pt-4 sm:flex-row sm:justify-end">
          <AppButton type="button" @click="router.push('/tags')">取消</AppButton>
          <AppButton tone="primary" type="submit" :disabled="isSaving">
            {{ isSaving ? '保存中...' : '保存标签' }}
          </AppButton>
        </div>
      </template>
    </form>
  </ResponsiveEditorShell>
</template>
