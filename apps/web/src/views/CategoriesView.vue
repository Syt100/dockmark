<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'

import type { Category } from '@dockmark/shared'

import { createCategory, deleteCategory, fetchCategories, updateCategory } from '../api/client'

const categories = ref<Category[]>([])
const editingId = ref<string | null>(null)
const error = ref<string | null>(null)
const form = reactive({
  name: '',
  slug: '',
  icon: '',
  color: '',
  sortOrder: 0,
})

async function load() {
  categories.value = await fetchCategories()
}

function reset() {
  editingId.value = null
  form.name = ''
  form.slug = ''
  form.icon = ''
  form.color = ''
  form.sortOrder = 0
}

function edit(category: Category) {
  editingId.value = category.id
  form.name = category.name
  form.slug = category.slug
  form.icon = category.icon ?? ''
  form.color = category.color ?? ''
  form.sortOrder = category.sortOrder
}

async function submit() {
  error.value = null

  try {
    const input = {
      name: form.name,
      slug: form.slug || undefined,
      icon: form.icon || null,
      color: form.color || null,
      sortOrder: form.sortOrder,
    }

    if (editingId.value) {
      await updateCategory(editingId.value, input)
    } else {
      await createCategory(input)
    }

    reset()
    await load()
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : 'Unable to save category'
  }
}

async function remove(id: string) {
  await deleteCategory(id)
  await load()
}

onMounted(load)
</script>

<template>
  <main class="grid gap-6">
    <section class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-semibold text-slate-950">Categories</h1>
        <p class="mt-1 text-sm text-slate-600">Group services for the home navigation view.</p>
      </div>
    </section>

    <form class="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm" @submit.prevent="submit">
      <div class="grid gap-4 md:grid-cols-5">
        <label class="grid gap-1 text-sm">
          <span class="font-medium text-slate-700">Name</span>
          <input v-model="form.name" class="rounded-md border border-slate-300 px-3 py-2" required />
        </label>
        <label class="grid gap-1 text-sm">
          <span class="font-medium text-slate-700">Slug</span>
          <input v-model="form.slug" class="rounded-md border border-slate-300 px-3 py-2" />
        </label>
        <label class="grid gap-1 text-sm">
          <span class="font-medium text-slate-700">Icon</span>
          <input v-model="form.icon" class="rounded-md border border-slate-300 px-3 py-2" />
        </label>
        <label class="grid gap-1 text-sm">
          <span class="font-medium text-slate-700">Color</span>
          <input v-model="form.color" class="rounded-md border border-slate-300 px-3 py-2" />
        </label>
        <label class="grid gap-1 text-sm">
          <span class="font-medium text-slate-700">Sort</span>
          <input v-model.number="form.sortOrder" class="rounded-md border border-slate-300 px-3 py-2" type="number" />
        </label>
      </div>

      <p v-if="error" class="rounded-md bg-amber-50 p-3 text-sm text-amber-900">{{ error }}</p>

      <div class="flex gap-2">
        <button class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white" type="submit">
          {{ editingId ? 'Save' : 'Create' }}
        </button>
        <button class="rounded-md border border-slate-300 px-4 py-2 text-sm" type="button" @click="reset">Reset</button>
      </div>
    </form>

    <section class="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <table class="w-full text-left text-sm">
        <thead class="bg-slate-100 text-slate-600">
          <tr>
            <th class="px-4 py-3">Name</th>
            <th class="px-4 py-3">Slug</th>
            <th class="px-4 py-3">Sort</th>
            <th class="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="category in categories" :key="category.id" class="border-t border-slate-200">
            <td class="px-4 py-3 font-medium text-slate-950">{{ category.name }}</td>
            <td class="px-4 py-3 text-slate-600">{{ category.slug }}</td>
            <td class="px-4 py-3 text-slate-600">{{ category.sortOrder }}</td>
            <td class="px-4 py-3 text-right">
              <button class="mr-2 text-blue-700" type="button" @click="edit(category)">Edit</button>
              <button class="text-rose-700" type="button" @click="remove(category.id)">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>
    </section>
  </main>
</template>

