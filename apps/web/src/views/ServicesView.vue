<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'

import type { Category, EndpointKind, ServiceItem, Tag } from '@dockmark/shared'

import {
  createItem,
  deleteItem,
  fetchCategories,
  fetchItems,
  fetchTags,
  updateItem,
} from '../api/client'

type EndpointForm = {
  id?: string
  label: string
  url: string
  kind: EndpointKind
  isPrimary: boolean
  sortOrder: number
}

const endpointKinds: EndpointKind[] = ['public', 'lan', 'tailscale', 'admin', 'backup', 'docs', 'api']
const items = ref<ServiceItem[]>([])
const categories = ref<Category[]>([])
const tags = ref<Tag[]>([])
const editingId = ref<string | null>(null)
const error = ref<string | null>(null)
const selectedTagIds = ref<string[]>([])
const form = reactive({
  name: '',
  categoryId: '',
  description: '',
  icon: '',
  credentialHint: '',
  note: '',
  status: 'active' as 'active' | 'hidden' | 'archived',
  sortOrder: 0,
  endpoints: [
    {
      label: 'Public',
      url: '',
      kind: 'public',
      isPrimary: true,
      sortOrder: 0,
    },
  ] as EndpointForm[],
})

const categoryById = computed(() => new Map(categories.value.map((category) => [category.id, category.name])))

async function load() {
  const [nextItems, nextCategories, nextTags] = await Promise.all([
    fetchItems(),
    fetchCategories(),
    fetchTags(),
  ])
  items.value = nextItems
  categories.value = nextCategories
  tags.value = nextTags
}

function reset() {
  editingId.value = null
  selectedTagIds.value = []
  form.name = ''
  form.categoryId = ''
  form.description = ''
  form.icon = ''
  form.credentialHint = ''
  form.note = ''
  form.status = 'active'
  form.sortOrder = 0
  form.endpoints = [
    {
      label: 'Public',
      url: '',
      kind: 'public',
      isPrimary: true,
      sortOrder: 0,
    },
  ]
}

function edit(item: ServiceItem) {
  editingId.value = item.id
  selectedTagIds.value = item.tags.map((tag) => tag.id)
  form.name = item.name
  form.categoryId = item.categoryId ?? ''
  form.description = item.description ?? ''
  form.icon = item.icon ?? ''
  form.credentialHint = item.credentialHint ?? ''
  form.note = item.note ?? ''
  form.status = item.status
  form.sortOrder = item.sortOrder
  form.endpoints = item.endpoints.map((endpoint) => ({
    id: endpoint.id,
    label: endpoint.label,
    url: endpoint.url,
    kind: endpoint.kind,
    isPrimary: endpoint.isPrimary,
    sortOrder: endpoint.sortOrder,
  }))
}

function addEndpoint() {
  form.endpoints.push({
    label: 'Endpoint',
    url: '',
    kind: 'public',
    isPrimary: form.endpoints.length === 0,
    sortOrder: form.endpoints.length,
  })
}

function setPrimary(index: number) {
  form.endpoints = form.endpoints.map((endpoint, current) => ({
    ...endpoint,
    isPrimary: current === index,
  }))
}

function removeEndpoint(index: number) {
  form.endpoints.splice(index, 1)
  if (!form.endpoints.some((endpoint) => endpoint.isPrimary) && form.endpoints[0]) {
    form.endpoints[0].isPrimary = true
  }
}

async function submit() {
  error.value = null

  try {
    const input = {
      name: form.name,
      categoryId: form.categoryId || null,
      description: form.description || null,
      icon: form.icon || null,
      iconType: 'emoji' as const,
      credentialHint: form.credentialHint || null,
      note: form.note || null,
      status: form.status,
      sortOrder: form.sortOrder,
      endpoints: form.endpoints.map((endpoint, index) => ({
        ...endpoint,
        sortOrder: index,
      })),
      tagIds: selectedTagIds.value,
    }

    if (editingId.value) {
      await updateItem(editingId.value, input)
    } else {
      await createItem(input)
    }

    reset()
    await load()
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : 'Unable to save service'
  }
}

async function remove(id: string) {
  await deleteItem(id)
  await load()
}

onMounted(load)
</script>

<template>
  <main class="grid gap-6">
    <section>
      <h1 class="text-2xl font-semibold text-slate-950">Services</h1>
      <p class="mt-1 text-sm text-slate-600">Manage Homelab entries, endpoints, tags, and Vaultwarden lookup hints.</p>
    </section>

    <form class="grid gap-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm" @submit.prevent="submit">
      <div class="grid gap-4 md:grid-cols-3">
        <label class="grid gap-1 text-sm">
          <span class="font-medium text-slate-700">Name</span>
          <input v-model="form.name" class="rounded-md border border-slate-300 px-3 py-2" required />
        </label>
        <label class="grid gap-1 text-sm">
          <span class="font-medium text-slate-700">Category</span>
          <select v-model="form.categoryId" class="rounded-md border border-slate-300 px-3 py-2">
            <option value="">Uncategorized</option>
            <option v-for="category in categories" :key="category.id" :value="category.id">{{ category.name }}</option>
          </select>
        </label>
        <label class="grid gap-1 text-sm">
          <span class="font-medium text-slate-700">Status</span>
          <select v-model="form.status" class="rounded-md border border-slate-300 px-3 py-2">
            <option value="active">Active</option>
            <option value="hidden">Hidden</option>
            <option value="archived">Archived</option>
          </select>
        </label>
      </div>

      <div class="grid gap-4 md:grid-cols-2">
        <label class="grid gap-1 text-sm">
          <span class="font-medium text-slate-700">Description</span>
          <input v-model="form.description" class="rounded-md border border-slate-300 px-3 py-2" />
        </label>
        <label class="grid gap-1 text-sm">
          <span class="font-medium text-slate-700">Icon</span>
          <input v-model="form.icon" class="rounded-md border border-slate-300 px-3 py-2" placeholder="emoji or text key" />
        </label>
      </div>

      <label class="grid gap-1 text-sm">
        <span class="font-medium text-slate-700">Vaultwarden lookup hint</span>
        <input
          v-model="form.credentialHint"
          class="rounded-md border border-slate-300 px-3 py-2"
          placeholder="Vaultwarden search Immich"
        />
      </label>

      <label class="grid gap-1 text-sm">
        <span class="font-medium text-slate-700">Notes</span>
        <textarea v-model="form.note" class="min-h-20 rounded-md border border-slate-300 px-3 py-2"></textarea>
      </label>

      <fieldset class="grid gap-3">
        <div class="flex items-center justify-between">
          <legend class="text-sm font-semibold text-slate-800">Endpoints</legend>
          <button class="rounded-md border border-slate-300 px-3 py-1.5 text-sm" type="button" @click="addEndpoint">
            Add endpoint
          </button>
        </div>

        <div v-for="(endpoint, index) in form.endpoints" :key="index" class="grid gap-3 rounded-md bg-slate-50 p-3 md:grid-cols-[1fr_2fr_1fr_auto_auto]">
          <input v-model="endpoint.label" class="rounded-md border border-slate-300 px-3 py-2 text-sm" placeholder="Label" required />
          <input v-model="endpoint.url" class="rounded-md border border-slate-300 px-3 py-2 text-sm" placeholder="https://..." required />
          <select v-model="endpoint.kind" class="rounded-md border border-slate-300 px-3 py-2 text-sm">
            <option v-for="kind in endpointKinds" :key="kind" :value="kind">{{ kind }}</option>
          </select>
          <label class="flex items-center gap-2 text-sm">
            <input :checked="endpoint.isPrimary" type="radio" name="primaryEndpoint" @change="setPrimary(index)" />
            Primary
          </label>
          <button class="text-sm text-rose-700" type="button" @click="removeEndpoint(index)">Remove</button>
        </div>
      </fieldset>

      <fieldset class="grid gap-2">
        <legend class="text-sm font-semibold text-slate-800">Tags</legend>
        <div class="flex flex-wrap gap-3">
          <label v-for="tag in tags" :key="tag.id" class="flex items-center gap-2 rounded-md bg-slate-100 px-3 py-2 text-sm">
            <input v-model="selectedTagIds" :value="tag.id" type="checkbox" />
            {{ tag.name }}
          </label>
        </div>
      </fieldset>

      <p v-if="error" class="rounded-md bg-amber-50 p-3 text-sm text-amber-900">{{ error }}</p>

      <div class="flex gap-2">
        <button class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white" type="submit">
          {{ editingId ? 'Save service' : 'Create service' }}
        </button>
        <button class="rounded-md border border-slate-300 px-4 py-2 text-sm" type="button" @click="reset">Reset</button>
      </div>
    </form>

    <section class="grid gap-3">
      <article v-for="item in items" :key="item.id" class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="text-lg font-semibold text-slate-950">{{ item.icon || '•' }} {{ item.name }}</p>
            <p class="text-sm text-slate-600">{{ categoryById.get(item.categoryId || '') || 'Uncategorized' }}</p>
            <p v-if="item.description" class="mt-1 text-sm text-slate-600">{{ item.description }}</p>
          </div>
          <div class="shrink-0">
            <button class="mr-2 text-sm text-blue-700" type="button" @click="edit(item)">Edit</button>
            <button class="text-sm text-rose-700" type="button" @click="remove(item.id)">Delete</button>
          </div>
        </div>
        <div class="mt-3 flex flex-wrap gap-2">
          <a
            v-for="endpoint in item.endpoints"
            :key="endpoint.id"
            :href="endpoint.url"
            class="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-700"
            target="_blank"
          >
            {{ endpoint.label }} · {{ endpoint.kind }}{{ endpoint.isPrimary ? ' · primary' : '' }}
          </a>
        </div>
      </article>
    </section>
  </main>
</template>

