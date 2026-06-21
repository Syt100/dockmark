<script setup lang="ts">
import { computed, ref } from 'vue'

import type {
  DockmarkExportDocument,
  DockmarkImportMode,
  ImportPreviewResponse,
} from '@dockmark/shared'

import { exportDockmarkData, importDockmarkData, previewDockmarkImport } from '../api/client'
import { toChineseError } from '../api/errors'
import AppButton from '../components/AppButton.vue'
import AppSelect from '../components/AppSelect.vue'
import FeedbackMessage from '../components/FeedbackMessage.vue'
import PageHeader from '../components/PageHeader.vue'

const mode = ref<DockmarkImportMode>('additive')
const document = ref<unknown>(null)
const fileName = ref('')
const preview = ref<ImportPreviewResponse | null>(null)
const error = ref<string | null>(null)
const feedback = ref<string | null>(null)
const isExporting = ref(false)
const isPreviewing = ref(false)
const isImporting = ref(false)
const replaceAllConfirmed = ref(false)

const canImport = computed(
  () =>
    document.value !== null &&
    preview.value?.ok === true &&
    !isImporting.value &&
    (mode.value !== 'replaceAll' || replaceAllConfirmed.value),
)
const summary = computed(() => preview.value?.summary ?? null)

function resetPreview() {
  preview.value = null
  feedback.value = null
  replaceAllConfirmed.value = false
}

function downloadJson(payload: DockmarkExportDocument) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const link = window.document.createElement('a')
  link.href = url
  link.download = `dockmark-export-${payload.generatedAt.slice(0, 10)}.json`
  link.click()
  URL.revokeObjectURL(url)
}

async function exportData() {
  isExporting.value = true
  error.value = null
  feedback.value = null

  try {
    downloadJson(await exportDockmarkData())
    feedback.value = '导出文件已准备下载'
  } catch (caught) {
    error.value = toChineseError(caught, '导出失败')
  } finally {
    isExporting.value = false
  }
}

async function readFile(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]

  resetPreview()
  error.value = null
  document.value = null
  fileName.value = file?.name ?? ''

  if (!file) {
    return
  }

  try {
    document.value = JSON.parse(await file.text())
  } catch {
    error.value = '导入文件必须是有效 JSON'
  }
}

async function previewImport() {
  if (document.value === null) {
    error.value = '请先选择 JSON 文件'
    return
  }

  isPreviewing.value = true
  error.value = null
  feedback.value = null
  preview.value = null
  replaceAllConfirmed.value = false

  try {
    preview.value = await previewDockmarkImport(mode.value, document.value)
  } catch (caught) {
    error.value = toChineseError(caught, '预检失败')
  } finally {
    isPreviewing.value = false
  }
}

async function executeImport() {
  if (!canImport.value) {
    return
  }

  isImporting.value = true
  error.value = null
  feedback.value = null

  try {
    const result = await importDockmarkData(mode.value, document.value)
    feedback.value = `导入完成：${result.imported.items} 个服务，${result.imported.endpoints} 个地址`
    preview.value = null
    replaceAllConfirmed.value = false
  } catch (caught) {
    error.value = toChineseError(caught, '导入失败')
  } finally {
    isImporting.value = false
  }
}
</script>

<template>
  <main class="dm-page-grid">
    <PageHeader title="导入 / 导出" description="备份、恢复或迁移 Dockmark 服务导航数据。" />

    <FeedbackMessage tone="success" :message="feedback" />
    <FeedbackMessage tone="error" :message="error" />

    <section class="dm-form-section">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 class="dm-section-title">导出 JSON</h2>
          <p class="mt-1 text-sm text-[var(--dm-text-muted)]">
            导出分类、标签、服务、地址和标签关系，不包含登录凭据或会话数据。
          </p>
        </div>
        <AppButton type="button" tone="primary" :disabled="isExporting" @click="exportData">
          {{ isExporting ? '导出中...' : '下载备份' }}
        </AppButton>
      </div>
    </section>

    <section class="dm-form-section">
      <div class="grid gap-4">
        <div>
          <h2 class="dm-section-title">导入 JSON</h2>
          <p class="mt-1 text-sm text-[var(--dm-text-muted)]">
            先上传文件并预检，确认摘要和错误后再写入数据。
          </p>
        </div>

        <div
          class="grid gap-[var(--dm-form-gap)] md:grid-cols-[minmax(0,1fr)_14rem_auto] md:items-end"
        >
          <label class="grid gap-1 text-sm">
            <span class="dm-label">JSON 文件</span>
            <input
              class="min-h-10 rounded-[var(--dm-radius-control)] border border-[var(--dm-border)] bg-[var(--dm-surface)] px-3 py-2 text-sm text-[var(--dm-text)] file:mr-3 file:rounded-[var(--dm-radius-control)] file:border-0 file:bg-[var(--dm-primary-soft)] file:px-3 file:py-1.5 file:text-[var(--dm-primary)]"
              accept="application/json,.json"
              type="file"
              @change="readFile"
            />
          </label>

          <label class="grid gap-1 text-sm">
            <span class="dm-label">导入模式</span>
            <AppSelect v-model="mode" @change="resetPreview">
              <option value="additive">追加导入</option>
              <option value="replaceAll">替换全部</option>
            </AppSelect>
          </label>

          <AppButton
            type="button"
            :disabled="document === null || isPreviewing"
            @click="previewImport"
          >
            {{ isPreviewing ? '预检中...' : '预检' }}
          </AppButton>
        </div>

        <p v-if="fileName" class="text-sm text-[var(--dm-text-muted)]">已选择：{{ fileName }}</p>

        <div
          v-if="mode === 'replaceAll'"
          class="rounded-[var(--dm-radius-surface)] border border-[var(--dm-danger)] bg-[var(--dm-danger-soft)] p-3 text-sm text-[var(--dm-danger)]"
        >
          替换全部会删除现有服务导航数据，再导入文件内容。
          <label class="mt-2 flex items-center gap-2">
            <input v-model="replaceAllConfirmed" type="checkbox" />
            我确认要替换全部数据
          </label>
        </div>

        <section v-if="preview" class="dm-surface-muted grid gap-3 p-4">
          <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h3 class="text-base font-semibold text-[var(--dm-text)]">
              {{ preview.ok ? '预检通过' : '预检未通过' }}
            </h3>
            <span class="text-sm text-[var(--dm-text-muted)]">
              {{ preview.mode === 'additive' ? '追加导入' : '替换全部' }}
            </span>
          </div>

          <dl v-if="summary" class="grid gap-3 text-sm sm:grid-cols-4" aria-label="导入摘要">
            <div>
              <dt class="text-[var(--dm-text-subtle)]">分类</dt>
              <dd class="font-medium text-[var(--dm-text)]">{{ summary.categories }}</dd>
            </div>
            <div>
              <dt class="text-[var(--dm-text-subtle)]">标签</dt>
              <dd class="font-medium text-[var(--dm-text)]">{{ summary.tags }}</dd>
            </div>
            <div>
              <dt class="text-[var(--dm-text-subtle)]">服务</dt>
              <dd class="font-medium text-[var(--dm-text)]">{{ summary.items }}</dd>
            </div>
            <div>
              <dt class="text-[var(--dm-text-subtle)]">地址</dt>
              <dd class="font-medium text-[var(--dm-text)]">{{ summary.endpoints }}</dd>
            </div>
          </dl>

          <ul v-if="preview.errors.length > 0" class="grid gap-1 text-sm text-[var(--dm-danger)]">
            <li v-for="item in preview.errors" :key="item">{{ item }}</li>
          </ul>
        </section>

        <div class="flex justify-end">
          <AppButton type="button" tone="primary" :disabled="!canImport" @click="executeImport">
            {{ isImporting ? '导入中...' : '确认导入' }}
          </AppButton>
        </div>
      </div>
    </section>
  </main>
</template>
