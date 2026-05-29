<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import type { Category, EndpointKind, ServiceItem, Tag } from '@dockmark/shared'

import {
  createItem,
  fetchCategories,
  fetchItem,
  fetchTags,
  updateItem,
} from '../api/client'
import { toChineseError } from '../api/errors'
import AppButton from '../components/AppButton.vue'
import AppInput from '../components/AppInput.vue'
import AppSelect from '../components/AppSelect.vue'
import AppTextarea from '../components/AppTextarea.vue'
import FeedbackMessage from '../components/FeedbackMessage.vue'
import ResponsiveEditorShell from '../components/ResponsiveEditorShell.vue'
import { endpointKindLabels, statusLabels } from '../ui/labels'

type EndpointForm = {
  id?: string
  label: string
  url: string
  kind: EndpointKind
  isPrimary: boolean
  sortOrder: number
}

const endpointKinds: EndpointKind[] = ['public', 'lan', 'tailscale', 'admin', 'backup', 'docs', 'api']
const endpointTemplates: Array<{ label: string; kind: EndpointKind }> = [
  { label: '公网', kind: 'public' },
  { label: '内网', kind: 'lan' },
  { label: 'Tailscale', kind: 'tailscale' },
  { label: '管理后台', kind: 'admin' },
  { label: '文档', kind: 'docs' },
]
const route = useRoute()
const router = useRouter()
const categories = ref<Category[]>([])
const tags = ref<Tag[]>([])
const selectedTagIds = ref<string[]>([])
const error = ref<string | null>(null)
const isLoading = ref(false)
const isSaving = ref(false)
const itemId = computed(() => (typeof route.params.id === 'string' ? route.params.id : null))
const isEditing = computed(() => itemId.value !== null)

const form = reactive({
  name: '',
  categoryId: '',
  description: '',
  icon: '',
  credentialHint: '',
  note: '',
  status: 'active' as ServiceItem['status'],
  sortOrder: 0,
  endpoints: [
    {
      label: '公网',
      url: '',
      kind: 'public',
      isPrimary: true,
      sortOrder: 0,
    },
  ] as EndpointForm[],
})

function applyItem(item: ServiceItem) {
  form.name = item.name
  form.categoryId = item.categoryId ?? ''
  form.description = item.description ?? ''
  form.icon = item.icon ?? ''
  form.credentialHint = item.credentialHint ?? ''
  form.note = item.note ?? ''
  form.status = item.status
  form.sortOrder = item.sortOrder
  selectedTagIds.value = item.tags.map((tag) => tag.id)
  form.endpoints = item.endpoints.map((endpoint) => ({
    id: endpoint.id,
    label: endpoint.label,
    url: endpoint.url,
    kind: endpoint.kind,
    isPrimary: endpoint.isPrimary,
    sortOrder: endpoint.sortOrder,
  }))
}

async function load() {
  isLoading.value = true
  error.value = null

  try {
    const [nextCategories, nextTags] = await Promise.all([fetchCategories(), fetchTags()])
    categories.value = nextCategories
    tags.value = nextTags

    if (itemId.value) {
      applyItem(await fetchItem(itemId.value))
    }
  } catch (caught) {
    error.value = toChineseError(caught, '加载服务失败')
  } finally {
    isLoading.value = false
  }
}

function addEndpoint() {
  addEndpointFromTemplate({ label: '访问地址', kind: 'public' })
}

function addEndpointFromTemplate(template: { label: string; kind: EndpointKind }) {
  form.endpoints.push({
    label: template.label,
    url: '',
    kind: template.kind,
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
  isSaving.value = true
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
        label: endpoint.label,
        url: endpoint.url,
        kind: endpoint.kind,
        isPrimary: endpoint.isPrimary,
        sortOrder: index,
      })),
      tagIds: selectedTagIds.value,
    }

    if (itemId.value) {
      await updateItem(itemId.value, input)
      await router.push({ path: '/services', query: { saved: 'updated' } })
    } else {
      await createItem(input)
      await router.push({ path: '/services', query: { saved: 'created' } })
    }
  } catch (caught) {
    error.value = toChineseError(caught, '保存服务失败')
  } finally {
    isSaving.value = false
  }
}

onMounted(load)
</script>

<template>
  <ResponsiveEditorShell :title="isEditing ? '编辑服务' : '新建服务'" back-to="/services">
    <form class="grid gap-[var(--dm-section-gap)]" @submit.prevent="submit">
      <FeedbackMessage tone="error" :message="error" />

      <div v-if="isLoading" class="dm-surface-muted p-4 text-sm text-[var(--dm-text-muted)]">
        正在加载服务信息...
      </div>

      <template v-else>
        <section class="grid gap-[var(--dm-form-gap)]">
          <h2 class="dm-section-title">基本信息</h2>
          <div class="grid gap-[var(--dm-form-gap)] md:grid-cols-3">
            <label class="grid gap-1 text-sm">
              <span class="dm-label">服务名称</span>
              <AppInput v-model="form.name" required />
            </label>
            <label class="grid gap-1 text-sm">
              <span class="dm-label">分类</span>
              <AppSelect v-model="form.categoryId">
                <option value="">未分类</option>
                <option v-for="category in categories" :key="category.id" :value="category.id">{{ category.name }}</option>
              </AppSelect>
            </label>
            <label class="grid gap-1 text-sm">
              <span class="dm-label">状态</span>
              <AppSelect v-model="form.status">
                <option v-for="(label, value) in statusLabels" :key="value" :value="value">{{ label }}</option>
              </AppSelect>
            </label>
          </div>

          <div class="grid gap-[var(--dm-form-gap)] md:grid-cols-2">
            <label class="grid gap-1 text-sm">
              <span class="dm-label">描述</span>
              <AppInput v-model="form.description" />
            </label>
            <label class="grid gap-1 text-sm">
              <span class="dm-label">图标</span>
              <AppInput v-model="form.icon" placeholder="例如 🏠 或服务缩写" />
            </label>
          </div>
        </section>

        <section class="grid gap-3">
          <div class="grid gap-3">
            <div class="flex items-center justify-between gap-3">
              <h2 class="dm-section-title">访问地址</h2>
              <AppButton type="button" @click="addEndpoint">添加地址</AppButton>
            </div>
            <div class="flex flex-wrap gap-2">
              <AppButton
                v-for="template in endpointTemplates"
                :key="template.kind"
                type="button"
                tone="ghost"
                @click="addEndpointFromTemplate(template)"
              >
                + {{ template.label }}
              </AppButton>
            </div>
          </div>

          <div v-for="(endpoint, index) in form.endpoints" :key="index" class="dm-surface-muted grid gap-3 p-3">
            <div class="grid gap-3 md:grid-cols-[1fr_2fr_1fr]">
              <label class="grid gap-1 text-sm">
                <span class="dm-label">名称</span>
                <AppInput v-model="endpoint.label" required />
              </label>
              <label class="grid gap-1 text-sm">
                <span class="dm-label">URL</span>
                <AppInput v-model="endpoint.url" placeholder="https://..." required />
              </label>
              <label class="grid gap-1 text-sm">
                <span class="dm-label">类型</span>
                <AppSelect v-model="endpoint.kind">
                  <option v-for="kind in endpointKinds" :key="kind" :value="kind">{{ endpointKindLabels[kind] }}</option>
                </AppSelect>
              </label>
            </div>
            <div class="flex flex-wrap items-center justify-between gap-3">
              <label class="flex items-center gap-2 text-sm text-[var(--dm-text-muted)]">
                <input :checked="endpoint.isPrimary" type="radio" name="primaryEndpoint" @change="setPrimary(index)" />
                设为主地址
              </label>
              <AppButton v-if="form.endpoints.length > 1" type="button" tone="ghost" @click="removeEndpoint(index)">
                移除地址
              </AppButton>
            </div>
          </div>
        </section>

        <section class="grid gap-3">
          <h2 class="dm-section-title">标签</h2>
          <div v-if="tags.length > 0" class="flex flex-wrap gap-2">
            <label
              v-for="tag in tags"
              :key="tag.id"
              class="flex min-h-10 items-center gap-2 rounded-[var(--dm-radius-control)] border border-[var(--dm-border)] bg-[var(--dm-surface)] px-3 py-2 text-sm text-[var(--dm-text-muted)]"
            >
              <input v-model="selectedTagIds" :value="tag.id" type="checkbox" />
              {{ tag.name }}
            </label>
          </div>
          <p v-else class="dm-surface-muted p-3 text-sm text-[var(--dm-text-muted)]">还没有标签。</p>
        </section>

        <section class="grid gap-[var(--dm-form-gap)]">
          <h2 class="dm-section-title">凭据提示与备注</h2>
          <label class="grid gap-1 text-sm">
            <span class="dm-label">Vaultwarden 搜索提示</span>
            <AppInput v-model="form.credentialHint" placeholder="例如：Vaultwarden 搜 Immich" />
          </label>
          <label class="grid gap-1 text-sm">
            <span class="dm-label">备注</span>
            <AppTextarea v-model="form.note" />
          </label>
        </section>

        <div class="grid gap-2 border-t border-[var(--dm-border)] pt-4 sm:flex sm:flex-row sm:justify-end">
          <AppButton class="w-full sm:w-auto" type="button" @click="router.push('/services')">取消</AppButton>
          <AppButton class="w-full sm:w-auto" tone="primary" type="submit" :disabled="isSaving">
            {{ isSaving ? '保存中...' : '保存服务' }}
          </AppButton>
        </div>
      </template>
    </form>
  </ResponsiveEditorShell>
</template>
