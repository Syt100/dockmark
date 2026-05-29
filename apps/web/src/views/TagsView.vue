<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'

import type { Tag } from '@dockmark/shared'

import { createTag, deleteTag, fetchTags } from '../api/client'

const tags = ref<Tag[]>([])
const error = ref<string | null>(null)
const form = reactive({
  name: '',
  slug: '',
})

async function load() {
  tags.value = await fetchTags()
}

async function submit() {
  error.value = null

  try {
    await createTag({
      name: form.name,
      slug: form.slug || undefined,
    })
    form.name = ''
    form.slug = ''
    await load()
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : 'Unable to save tag'
  }
}

async function remove(id: string) {
  await deleteTag(id)
  await load()
}

onMounted(load)
</script>

<template>
  <main class="grid gap-6">
    <section>
      <h1 class="text-2xl font-semibold text-slate-950">Tags</h1>
      <p class="mt-1 text-sm text-slate-600">Use tags for filtering and searching service attributes.</p>
    </section>

    <form class="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm" @submit.prevent="submit">
      <div class="grid gap-4 md:grid-cols-2">
        <label class="grid gap-1 text-sm">
          <span class="font-medium text-slate-700">Name</span>
          <input v-model="form.name" class="rounded-md border border-slate-300 px-3 py-2" required />
        </label>
        <label class="grid gap-1 text-sm">
          <span class="font-medium text-slate-700">Slug</span>
          <input v-model="form.slug" class="rounded-md border border-slate-300 px-3 py-2" />
        </label>
      </div>

      <p v-if="error" class="rounded-md bg-amber-50 p-3 text-sm text-amber-900">{{ error }}</p>

      <button class="w-fit rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white" type="submit">
        Create tag
      </button>
    </form>

    <section class="grid gap-2 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div v-for="tag in tags" :key="tag.id" class="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2">
        <div>
          <p class="font-medium text-slate-950">{{ tag.name }}</p>
          <p class="text-xs text-slate-500">{{ tag.slug }}</p>
        </div>
        <button class="text-sm text-rose-700" type="button" @click="remove(tag.id)">Delete</button>
      </div>
    </section>
  </main>
</template>

