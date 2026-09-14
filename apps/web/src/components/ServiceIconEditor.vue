<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import type { IconDiscoveryResult, IconType } from '@dockmark/shared'

import { ApiError, fetchServiceIcon, uploadServiceIcon } from '../api/client'
import { toChineseError } from '../api/errors'
import { discoverIconInBrowser } from '../ui/serviceIconDiscovery'
import AppButton from './AppButton.vue'
import AppInput from './AppInput.vue'
import AppSelect from './AppSelect.vue'
import ServiceIcon from './ServiceIcon.vue'

type IconSourceEndpoint = {
  label: string
  url: string
  isPrimary: boolean
}

const props = defineProps<{
  name: string
  icon: string
  iconType: IconType
  endpoints: IconSourceEndpoint[]
}>()

const emit = defineEmits<{
  'update:icon': [value: string]
  'update:iconType': [value: IconType]
}>()

const selectedSourceUrl = ref('')
const candidate = ref<IconDiscoveryResult | null>(null)
const error = ref<string | null>(null)
const feedback = ref<string | null>(null)
const isBrowserFetching = ref(false)
const isServerFetching = ref(false)

const sourceEndpoints = computed(() => props.endpoints.filter((endpoint) => endpoint.url.trim().length > 0))
const isFetching = computed(() => isBrowserFetching.value || isServerFetching.value)
const primaryUrl = computed(
  () => props.endpoints.find((endpoint) => endpoint.isPrimary)?.url ?? props.endpoints[0]?.url ?? null,
)
const candidateLabel = computed(() => {
  if (!candidate.value) return ''
  if (candidate.value.kind === 'managed') {
    return `托管图标 · ${candidate.value.mimeType} · ${formatBytes(candidate.value.byteLength)}`
  }
  return '外部图标 URL'
})

watch(
  () => props.endpoints.map((endpoint) => `${endpoint.url}|${endpoint.isPrimary}`).join('\n'),
  () => {
    const urls = new Set(sourceEndpoints.value.map((endpoint) => endpoint.url))
    if (selectedSourceUrl.value && urls.has(selectedSourceUrl.value)) return

    selectedSourceUrl.value =
      sourceEndpoints.value.find((endpoint) => endpoint.isPrimary)?.url ??
      sourceEndpoints.value[0]?.url ??
      ''
  },
  { immediate: true },
)

function formatBytes(value: number): string {
  if (value < 1024) return `${value} B`
  return `${Math.round(value / 1024)} KiB`
}

function iconDiscoveryError(caught: unknown, fallback: string): string {
  if (caught instanceof ApiError && caught.code === 'validation_failed' && caught.message.trim()) {
    return caught.message
  }

  return toChineseError(caught, fallback)
}

function updateIconType(value: string) {
  candidate.value = null
  error.value = null
  feedback.value = null
  const nextType = value as IconType
  const shouldClearValue = nextType === 'favicon' || (props.iconType === 'r2' && nextType !== 'r2')

  emit('update:iconType', nextType)

  if (shouldClearValue) {
    emit('update:icon', '')
  }
}

function updateIcon(value: string) {
  candidate.value = null
  error.value = null
  feedback.value = null
  emit('update:icon', value)
}

async function browserFetch() {
  if (!selectedSourceUrl.value) {
    error.value = '请先填写并选择一个服务地址'
    return
  }

  isBrowserFetching.value = true
  candidate.value = null
  error.value = null
  feedback.value = null

  try {
    const discovered = await discoverIconInBrowser(selectedSourceUrl.value)

    if (discovered.kind === 'blob') {
      candidate.value = await uploadServiceIcon(discovered.blob, discovered.sourceUrl)
    } else {
      candidate.value = {
        kind: 'external',
        iconType: 'url',
        icon: discovered.sourceUrl,
        sourceUrl: discovered.sourceUrl,
        ...(discovered.width ? { width: discovered.width } : {}),
        ...(discovered.height ? { height: discovered.height } : {}),
      }
    }
  } catch (caught) {
    error.value = iconDiscoveryError(caught, '浏览器没有找到可用的网站图标')
  } finally {
    isBrowserFetching.value = false
  }
}

async function serverFetch() {
  if (!selectedSourceUrl.value) {
    error.value = '请先填写并选择一个服务地址'
    return
  }

  isServerFetching.value = true
  candidate.value = null
  error.value = null
  feedback.value = null

  try {
    candidate.value = await fetchServiceIcon(selectedSourceUrl.value)
  } catch (caught) {
    error.value = iconDiscoveryError(caught, '服务端没有找到可用的网站图标')
  } finally {
    isServerFetching.value = false
  }
}

function acceptCandidate() {
  if (!candidate.value) return

  emit('update:iconType', candidate.value.iconType)
  emit('update:icon', candidate.value.icon)
  feedback.value = '已应用候选图标，保存服务后生效。'
  candidate.value = null
  error.value = null
}
</script>

<template>
  <div class="grid gap-3">
    <div class="grid gap-2 sm:grid-cols-[auto_minmax(8rem,0.8fr)_minmax(8rem,1fr)] sm:items-center">
      <ServiceIcon
        :icon="icon"
        :icon-type="iconType"
        :name="name || '服务'"
        :primary-url="primaryUrl"
      />
      <AppSelect
        :model-value="iconType"
        aria-label="图标类型"
        name="service-icon-type"
        @update:model-value="updateIconType"
      >
        <option value="emoji">Emoji / 文本</option>
        <option value="url">图片 URL</option>
        <option value="favicon">主地址 Favicon</option>
        <option v-if="iconType === 'r2'" value="r2" disabled>Dockmark 托管图标</option>
      </AppSelect>
      <AppInput
        v-if="iconType === 'emoji'"
        :model-value="icon"
        name="service-icon-value"
        placeholder="例如 🏠 或服务缩写"
        @update:model-value="updateIcon"
      />
      <AppInput
        v-else-if="iconType === 'url'"
        :model-value="icon"
        name="service-icon-url"
        placeholder="https://example.com/icon.png"
        type="url"
        @update:model-value="updateIcon"
      />
      <p v-else-if="iconType === 'r2'" class="truncate text-xs text-[var(--dm-text-subtle)]" :title="icon">
        Dockmark 托管 · {{ icon.split('/').at(-1) }}
      </p>
      <p v-else class="text-xs text-[var(--dm-text-subtle)]">自动使用主地址 `/favicon.ico`</p>
    </div>

    <div class="rounded-[var(--dm-radius-surface)] border border-[var(--dm-border)] bg-[var(--dm-surface-muted)] p-3">
      <div class="grid gap-2 sm:grid-cols-[minmax(10rem,1fr)_auto_auto] sm:items-end">
        <label class="grid gap-1 text-sm">
          <span class="dm-label">自动获取来源</span>
          <AppSelect v-model="selectedSourceUrl" name="service-icon-source" :disabled="sourceEndpoints.length === 0">
            <option v-if="sourceEndpoints.length === 0" value="">请先填写服务地址</option>
            <option v-for="(endpoint, index) in sourceEndpoints" :key="`${endpoint.url}-${index}`" :value="endpoint.url">
              {{ endpoint.label }}{{ endpoint.isPrimary ? '（主地址）' : '' }} · {{ endpoint.url }}
            </option>
          </AppSelect>
        </label>
        <AppButton type="button" :disabled="isFetching || !selectedSourceUrl" @click="browserFetch">
          {{ isBrowserFetching ? '浏览器获取中...' : '浏览器获取' }}
        </AppButton>
        <AppButton type="button" :disabled="isFetching || !selectedSourceUrl" @click="serverFetch">
          {{ isServerFetching ? '服务端获取中...' : '服务端获取' }}
        </AppButton>
      </div>
      <p class="mt-2 text-xs leading-5 text-[var(--dm-text-subtle)]">
        浏览器获取适合当前设备可访问的地址；服务端获取仅允许公网 HTTP(S) 地址。两种方式不会自动互相切换。
      </p>
    </div>

    <p v-if="error" role="alert" class="text-sm text-[var(--dm-danger)]">{{ error }}</p>
    <p v-if="feedback" role="status" class="text-sm text-[var(--dm-success)]">{{ feedback }}</p>

    <div
      v-if="candidate"
      class="flex flex-col gap-3 rounded-[var(--dm-radius-surface)] border border-[var(--dm-primary)] bg-[var(--dm-primary-soft)] p-3 sm:flex-row sm:items-center sm:justify-between"
      data-icon-candidate
    >
      <div class="flex min-w-0 items-center gap-3">
        <ServiceIcon
          :icon="candidate.icon"
          :icon-type="candidate.iconType"
          :name="name || '服务'"
          :primary-url="selectedSourceUrl"
          size="lg"
        />
        <div class="min-w-0">
          <p class="text-sm font-medium text-[var(--dm-text)]">{{ candidateLabel }}</p>
          <p class="mt-1 truncate text-xs text-[var(--dm-text-muted)]" :title="candidate.sourceUrl">
            {{ candidate.sourceUrl }}
          </p>
        </div>
      </div>
      <div class="flex shrink-0 gap-2">
        <AppButton type="button" tone="ghost" @click="candidate = null">放弃</AppButton>
        <AppButton type="button" tone="primary" @click="acceptCandidate">使用此图标</AppButton>
      </div>
    </div>
  </div>
</template>
