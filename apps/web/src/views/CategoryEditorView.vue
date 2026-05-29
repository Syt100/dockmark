<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { createCategory, fetchCategories, updateCategory } from '../api/client'
import { toChineseError } from '../api/errors'
import AppButton from '../components/AppButton.vue'
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
    <form class="grid gap-5" @submit.prevent="submit">
      <FeedbackMessage tone="error" :message="error" />

      <div v-if="isLoading" class="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
        正在加载分类...
      </div>

      <template v-else>
        <div class="grid gap-4 md:grid-cols-2">
          <label class="grid gap-1 text-sm">
            <span class="font-medium text-slate-700">分类名称</span>
            <input v-model="form.name" class="rounded-md border border-slate-300 px-3 py-2" required />
          </label>
          <label class="grid gap-1 text-sm">
            <span class="font-medium text-slate-700">Slug</span>
            <input v-model="form.slug" class="rounded-md border border-slate-300 px-3 py-2" placeholder="留空则自动生成" />
          </label>
          <label class="grid gap-1 text-sm">
            <span class="font-medium text-slate-700">图标</span>
            <input v-model="form.icon" class="rounded-md border border-slate-300 px-3 py-2" placeholder="例如 🧰" />
          </label>
          <label class="grid gap-1 text-sm">
            <span class="font-medium text-slate-700">颜色</span>
            <input v-model="form.color" class="rounded-md border border-slate-300 px-3 py-2" placeholder="#2563eb" />
          </label>
          <label class="grid gap-1 text-sm md:col-span-2">
            <span class="font-medium text-slate-700">排序</span>
            <input v-model.number="form.sortOrder" class="rounded-md border border-slate-300 px-3 py-2" type="number" />
          </label>
        </div>

        <div class="flex flex-col-reverse gap-2 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">
          <AppButton type="button" @click="router.push('/categories')">取消</AppButton>
          <AppButton tone="primary" type="submit" :disabled="isSaving">
            {{ isSaving ? '保存中...' : '保存分类' }}
          </AppButton>
        </div>
      </template>
    </form>
  </ResponsiveEditorShell>
</template>
