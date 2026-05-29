<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { createCategory, fetchCategories, updateCategory } from '../api/client'
import { toChineseError } from '../api/errors'
import AppButton from '../components/AppButton.vue'
import AppInput from '../components/AppInput.vue'
import FeedbackMessage from '../components/FeedbackMessage.vue'
import ResponsiveEditorShell from '../components/ResponsiveEditorShell.vue'

const route = useRoute()
const router = useRouter()
const error = ref<string | null>(null)
const isLoading = ref(false)
const isSaving = ref(false)
const categoryId = computed(() => (typeof route.params.id === 'string' ? route.params.id : null))
const isEditing = computed(() => categoryId.value !== null)

const form = reactive({
  name: '',
  slug: '',
  icon: '',
  color: '',
  sortOrder: 0,
})

async function load() {
  if (!categoryId.value) {
    return
  }

  isLoading.value = true
  error.value = null

  try {
    const category = (await fetchCategories()).find((entry) => entry.id === categoryId.value)

    if (!category) {
      error.value = '分类不存在'
      return
    }

    form.name = category.name
    form.slug = category.slug
    form.icon = category.icon ?? ''
    form.color = category.color ?? ''
    form.sortOrder = category.sortOrder
  } catch (caught) {
    error.value = toChineseError(caught, '加载分类失败')
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
      icon: form.icon || null,
      color: form.color || null,
      sortOrder: form.sortOrder,
    }

    if (categoryId.value) {
      await updateCategory(categoryId.value, input)
      await router.push({ path: '/categories', query: { saved: 'updated' } })
    } else {
      await createCategory(input)
      await router.push({ path: '/categories', query: { saved: 'created' } })
    }
  } catch (caught) {
    error.value = toChineseError(caught, '保存分类失败')
  } finally {
    isSaving.value = false
  }
}

onMounted(load)
</script>

<template>
  <ResponsiveEditorShell :title="isEditing ? '编辑分类' : '新建分类'" back-to="/categories">
    <form class="grid gap-[var(--dm-section-gap)]" @submit.prevent="submit">
      <FeedbackMessage tone="error" :message="error" />

      <div v-if="isLoading" class="dm-surface-muted p-4 text-sm text-[var(--dm-text-muted)]">
        正在加载分类...
      </div>

      <template v-else>
        <div class="grid gap-[var(--dm-form-gap)] md:grid-cols-2">
          <label class="grid gap-1 text-sm">
            <span class="dm-label">分类名称</span>
            <AppInput v-model="form.name" required />
          </label>
          <label class="grid gap-1 text-sm">
            <span class="dm-label">Slug</span>
            <AppInput v-model="form.slug" placeholder="留空则自动生成" />
          </label>
          <label class="grid gap-1 text-sm">
            <span class="dm-label">图标</span>
            <AppInput v-model="form.icon" placeholder="例如 🧰" />
          </label>
          <label class="grid gap-1 text-sm">
            <span class="dm-label">颜色</span>
            <AppInput v-model="form.color" placeholder="#2563eb" />
          </label>
          <label class="grid gap-1 text-sm md:col-span-2">
            <span class="dm-label">排序</span>
            <input v-model.number="form.sortOrder" class="dm-control w-full" type="number" />
          </label>
        </div>

        <div class="flex flex-col-reverse gap-2 border-t border-[var(--dm-border)] pt-4 sm:flex-row sm:justify-end">
          <AppButton type="button" @click="router.push('/categories')">取消</AppButton>
          <AppButton tone="primary" type="submit" :disabled="isSaving">
            {{ isSaving ? '保存中...' : '保存分类' }}
          </AppButton>
        </div>
      </template>
    </form>
  </ResponsiveEditorShell>
</template>
