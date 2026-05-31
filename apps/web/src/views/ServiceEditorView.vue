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
import EditorLoadingState from '../components/EditorLoadingState.vue'
import FeedbackMessage from '../components/FeedbackMessage.vue'
import ResponsiveEditorShell from '../components/ResponsiveEditorShell.vue'
import { endpointKindLabels, statusLabels } from '../ui/labels'
import { serviceFormToInput, serviceToForm, type EndpointForm } from './managementForms'

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
const isReferenceLoading = ref(false)
const tagQuery = ref('')
const itemId = computed(() => (typeof route.params.id === 'string' ? route.params.id : null))
const isEditing = computed(() => itemId.value !== null)
const normalizedTagQuery = computed(() => tagQuery.value.trim().toLowerCase())
const filteredTags = computed(() => {
  const query = normalizedTagQuery.value

  if (!query) {
    return tags.value
  }

  return tags.value.filter((tag) => [tag.name, tag.slug].some((value) => value.toLowerCase().includes(query)))
})
const selectedTagCount = computed(() => selectedTagIds.value.length)

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
  Object.assign(form, serviceToForm(item))
  selectedTagIds.value = item.tags.map((tag) => tag.id)
}

async function load() {
  if (itemId.value) {
    isLoading.value = true
  } else {
    isReferenceLoading.value = true
  }

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
    isReferenceLoading.value = false
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
    const input = serviceFormToInput(form, selectedTagIds.value)

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

      <EditorLoadingState v-if="isLoading" message="正在加载服务信息..." variant="service" />

      <template v-else>
        <section class="dm-form-section">
          <h2 class="dm-section-title">基本信息</h2>
          <div class="grid gap-[var(--dm-form-gap)] md:grid-cols-3">
            <label class="grid gap-1 text-sm">
              <span class="dm-label">服务名称</span>
              <AppInput v-model="form.name" required />
            </label>
            <label class="grid gap-1 text-sm">
              <span class="dm-label">分类</span>
              <AppSelect v-model="form.categoryId" :disabled="isReferenceLoading">
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

        <section class="dm-form-section">
          <div class="grid gap-3">
            <div class="flex items-center justify-between gap-3">
              <h2 class="dm-section-title">访问地址</h2>
              <AppButton type="button" @click="addEndpoint">添加地址</AppButton>
            </div>
            <div class="flex flex-wrap gap-1.5 rounded-[var(--dm-radius-surface)] border border-[var(--dm-border)] bg-[var(--dm-surface)] p-1.5">
              <AppButton
                v-for="template in endpointTemplates"
                :key="template.kind"
                size="sm"
                type="button"
                tone="ghost"
                @click="addEndpointFromTemplate(template)"
              >
                + {{ template.label }}
              </AppButton>
            </div>
          </div>

          <TransitionGroup class="grid gap-2" name="dm-list" tag="div">
            <div
              v-for="(endpoint, index) in form.endpoints"
              :key="index"
              class="grid gap-3 rounded-[var(--dm-radius-surface)] bg-[var(--dm-surface-muted)] p-3 md:grid-cols-[2.4rem_minmax(7rem,1fr)_minmax(12rem,2fr)_minmax(8rem,1fr)_auto] md:items-end"
            >
              <div class="hidden h-10 items-center justify-center rounded-[var(--dm-radius-control)] bg-[var(--dm-surface)] text-sm font-medium text-[var(--dm-text-muted)] md:flex">
                {{ index + 1 }}
              </div>
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
              <div class="flex flex-wrap items-center gap-2 md:justify-end">
                <label class="flex min-h-10 items-center gap-2 whitespace-nowrap text-sm text-[var(--dm-text-muted)]">
                  <input :checked="endpoint.isPrimary" type="radio" name="primaryEndpoint" @change="setPrimary(index)" />
                  主地址
                </label>
                <AppButton v-if="form.endpoints.length > 1" type="button" tone="ghost" @click="removeEndpoint(index)">
                  移除
                </AppButton>
              </div>
            </div>
          </TransitionGroup>
        </section>

        <section class="dm-form-section">
          <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 class="dm-section-title">标签</h2>
            <span class="text-xs text-[var(--dm-text-subtle)]">{{ isReferenceLoading ? '正在加载标签...' : `已选 ${selectedTagCount} 个` }}</span>
          </div>
          <AppInput v-if="tags.length > 8" v-model="tagQuery" aria-label="搜索标签" placeholder="搜索标签" type="search" />
          <div v-if="tags.length > 0" class="flex flex-wrap gap-2">
            <label
              v-for="tag in filteredTags"
              :key="tag.id"
              :class="[
                'flex min-h-10 items-center gap-2 rounded-[var(--dm-radius-control)] border px-3 py-2 text-sm transition',
                selectedTagIds.includes(tag.id)
                  ? 'border-[var(--dm-primary)] bg-[var(--dm-primary-soft)] text-[var(--dm-primary)]'
                  : 'border-[var(--dm-border)] bg-[var(--dm-surface)] text-[var(--dm-text-muted)] hover:bg-[var(--dm-surface-muted)]',
              ]"
            >
              <input v-model="selectedTagIds" :value="tag.id" type="checkbox" />
              {{ tag.name }}
            </label>
            <p v-if="filteredTags.length === 0" class="text-sm text-[var(--dm-text-muted)]">没有匹配的标签。</p>
          </div>
          <p v-else class="dm-surface-muted p-3 text-sm text-[var(--dm-text-muted)]">{{ isReferenceLoading ? '标签加载中...' : '还没有标签。' }}</p>
        </section>

        <section class="dm-form-section">
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
