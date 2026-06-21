<script setup lang="ts">
import { computed, ref } from 'vue'

import type {
  DockmarkExportDocument,
  DockmarkImportMode,
  ImportIssue,
  ImportPreviewResponse,
} from '@dockmark/shared'

import { exportDockmarkData, importDockmarkData, previewDockmarkImport } from '../api/client'
import { toChineseError } from '../api/errors'
import AppButton from '../components/AppButton.vue'
import AppLinkButton from '../components/AppLinkButton.vue'
import AppSelect from '../components/AppSelect.vue'
import FeedbackMessage from '../components/FeedbackMessage.vue'
import PageHeader from '../components/PageHeader.vue'

const mode = ref<DockmarkImportMode>('additive')
const document = ref<unknown>(null)
const fileName = ref('')
const preview = ref<ImportPreviewResponse | null>(null)
const error = ref<string | null>(null)
const feedback = ref<string | null>(null)
const resultDetails = ref<ImportPreviewResponse['details'] | null>(null)
const isExporting = ref(false)
const isPreviewing = ref(false)
const isImporting = ref(false)
const replaceAllConfirmation = ref('')

const canImport = computed(
  () =>
    document.value !== null &&
    preview.value?.ok === true &&
    !isImporting.value &&
    (mode.value !== 'replaceAll' || replaceAllConfirmation.value.trim() === '替换全部'),
)
const summary = computed(() => preview.value?.summary ?? null)
const importableSummary = computed(() => preview.value?.importable ?? null)
const skippedSummary = computed(() => preview.value?.skipped ?? null)
const currentSummary = computed(() => preview.value?.currentSummary ?? null)
const modeDescription = computed(() => {
  if (mode.value === 'replaceAll') return '清空当前服务导航数据后恢复文件内容。'
  if (mode.value === 'additiveSkipConflicts') return '自动跳过冲突记录，只导入安全的新记录。'
  return '只追加新记录；如发现冲突会停止，不写入数据。'
})
const modeLabel = computed(() => {
  if (preview.value?.mode === 'replaceAll') return '替换全部'
  if (preview.value?.mode === 'additiveSkipConflicts') return '跳过冲突导入'
  return '追加导入'
})
const hasImportableDetails = computed(
  () =>
    (preview.value?.details?.importable.categories.length ?? 0) > 0 ||
    (preview.value?.details?.importable.tags.length ?? 0) > 0 ||
    (preview.value?.details?.importable.items.length ?? 0) > 0,
)
const hasSkippedDetails = computed(
  () =>
    (preview.value?.details?.skipped.categories.length ?? 0) > 0 ||
    (preview.value?.details?.skipped.tags.length ?? 0) > 0 ||
    (preview.value?.details?.skipped.items.length ?? 0) > 0,
)
const groupedIssues = computed(() => {
  const groups: Array<{
    key: ImportIssue['entityType']
    label: string
    issues: ImportIssue[]
  }> = [
    { key: 'document', label: '文件问题', issues: [] },
    { key: 'category', label: '分类冲突', issues: [] },
    { key: 'tag', label: '标签冲突', issues: [] },
    { key: 'item', label: '服务冲突', issues: [] },
    { key: 'endpoint', label: '地址冲突', issues: [] },
  ]
  const byKey = new Map(groups.map((group) => [group.key, group]))

  for (const issue of preview.value?.issues ?? []) {
    byKey.get(issue.entityType)?.issues.push(issue)
  }

  if ((preview.value?.issues.length ?? 0) === 0) {
    for (const message of preview.value?.errors ?? []) {
      byKey.get('document')?.issues.push({
        severity: 'error',
        kind: 'validation',
        entityType: 'document',
        message,
      })
    }
  }

  return groups.filter((group) => group.issues.length > 0)
})
const canSkipConflicts = computed(
  () =>
    preview.value?.mode === 'additive' &&
    preview.value.ok === false &&
    (preview.value.issues ?? []).some((issue) => issue.kind === 'conflict') &&
    !(preview.value.issues ?? []).some(
      (issue) => issue.severity === 'error' && issue.kind !== 'conflict',
    ),
)

function resetPreview() {
  preview.value = null
  feedback.value = null
  resultDetails.value = null
  replaceAllConfirmation.value = ''
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
  resultDetails.value = null

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
  replaceAllConfirmation.value = ''

  try {
    preview.value = await previewDockmarkImport(mode.value, document.value)
  } catch (caught) {
    error.value = toChineseError(caught, '预检失败')
  } finally {
    isPreviewing.value = false
  }
}

async function previewSkipConflicts() {
  mode.value = 'additiveSkipConflicts'
  await previewImport()
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
    resultDetails.value = result.details ?? null
    preview.value = null
    replaceAllConfirmation.value = ''
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

    <section v-if="resultDetails" class="dm-form-section">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 class="dm-section-title">导入结果</h2>
          <p class="mt-1 text-sm text-[var(--dm-text-muted)]">
            已导入 {{ resultDetails.importable.categories.length }} 个分类、{{
              resultDetails.importable.tags.length
            }}
            个标签、{{ resultDetails.importable.items.length }} 个服务。
          </p>
        </div>
        <AppLinkButton to="/services" tone="primary">查看服务</AppLinkButton>
      </div>
      <div v-if="resultDetails.importable.items.length > 0" class="mt-4">
        <h3 class="text-sm font-medium text-[var(--dm-text)]">已导入服务</h3>
        <div class="mt-2 flex flex-wrap gap-2">
          <span
            v-for="item in resultDetails.importable.items"
            :key="item.id"
            class="rounded-[var(--dm-radius-control)] bg-[var(--dm-surface-muted)] px-2 py-1 text-sm text-[var(--dm-text-muted)]"
          >
            {{ item.name }}
          </span>
        </div>
      </div>
    </section>

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
              <option value="additiveSkipConflicts">跳过冲突导入</option>
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

        <p class="text-sm text-[var(--dm-text-muted)]">{{ modeDescription }}</p>

        <p v-if="fileName" class="text-sm text-[var(--dm-text-muted)]">已选择：{{ fileName }}</p>

        <div
          v-if="mode === 'replaceAll'"
          class="rounded-[var(--dm-radius-surface)] border border-[var(--dm-danger)] bg-[var(--dm-danger-soft)] p-3 text-sm text-[var(--dm-danger)]"
        >
          替换全部会删除现有服务导航数据，再导入文件内容。
          <p v-if="currentSummary" class="mt-2">
            当前数据：{{ currentSummary.categories }} 个分类，{{ currentSummary.tags }} 个标签，{{
              currentSummary.items
            }}
            个服务，{{ currentSummary.endpoints }} 个地址。
          </p>
          <label class="mt-2 grid gap-1">
            <span class="font-medium">输入“替换全部”以确认</span>
            <input
              v-model="replaceAllConfirmation"
              class="min-h-10 rounded-[var(--dm-radius-control)] border border-[var(--dm-danger)] bg-[var(--dm-surface)] px-3 py-2 text-sm text-[var(--dm-text)]"
              autocomplete="off"
              type="text"
            />
          </label>
        </div>

        <section v-if="preview" class="dm-surface-muted grid gap-3 p-4">
          <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h3 class="text-base font-semibold text-[var(--dm-text)]">
              {{ preview.ok ? '预检通过' : '预检未通过' }}
            </h3>
            <span class="text-sm text-[var(--dm-text-muted)]">{{ modeLabel }}</span>
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

          <div
            v-if="importableSummary && skippedSummary"
            class="grid gap-3 border-t border-[var(--dm-border)] pt-3 text-sm sm:grid-cols-2"
          >
            <div>
              <h4 class="font-medium text-[var(--dm-text)]">可导入</h4>
              <p class="mt-1 text-[var(--dm-text-muted)]">
                {{ importableSummary.categories }} 个分类，{{ importableSummary.tags }} 个标签，{{
                  importableSummary.items
                }}
                个服务，{{ importableSummary.endpoints }} 个地址
              </p>
            </div>
            <div>
              <h4 class="font-medium text-[var(--dm-text)]">将跳过</h4>
              <p class="mt-1 text-[var(--dm-text-muted)]">
                {{ skippedSummary.categories }} 个分类，{{ skippedSummary.tags }} 个标签，{{
                  skippedSummary.items
                }}
                个服务，{{ skippedSummary.endpoints }} 个地址
              </p>
            </div>
          </div>

          <div
            v-if="hasImportableDetails || hasSkippedDetails"
            class="grid gap-3 border-t border-[var(--dm-border)] pt-3 text-sm md:grid-cols-2"
          >
            <section v-if="hasImportableDetails">
              <h4 class="font-medium text-[var(--dm-text)]">将导入的记录</h4>
              <div class="mt-2 grid gap-2 text-[var(--dm-text-muted)]">
                <p v-if="preview.details?.importable.categories.length">
                  分类：{{
                    preview.details.importable.categories.map((item) => item.name).join('、')
                  }}
                </p>
                <p v-if="preview.details?.importable.tags.length">
                  标签：{{ preview.details.importable.tags.map((item) => item.name).join('、') }}
                </p>
                <p v-if="preview.details?.importable.items.length">
                  服务：{{ preview.details.importable.items.map((item) => item.name).join('、') }}
                </p>
              </div>
            </section>
            <section v-if="hasSkippedDetails">
              <h4 class="font-medium text-[var(--dm-text)]">将跳过的记录</h4>
              <div class="mt-2 grid gap-2 text-[var(--dm-text-muted)]">
                <p v-if="preview.details?.skipped.categories.length">
                  分类：{{ preview.details.skipped.categories.map((item) => item.name).join('、') }}
                </p>
                <p v-if="preview.details?.skipped.tags.length">
                  标签：{{ preview.details.skipped.tags.map((item) => item.name).join('、') }}
                </p>
                <p v-if="preview.details?.skipped.items.length">
                  服务：{{ preview.details.skipped.items.map((item) => item.name).join('、') }}
                </p>
              </div>
            </section>
          </div>

          <div v-if="groupedIssues.length > 0" class="grid gap-3">
            <section
              v-for="group in groupedIssues"
              :key="group.key"
              class="rounded-[var(--dm-radius-control)] border border-[var(--dm-border)] bg-[var(--dm-surface)] p-3"
            >
              <h4 class="text-sm font-medium text-[var(--dm-text)]">{{ group.label }}</h4>
              <ul class="mt-2 grid gap-1 text-sm">
                <li
                  v-for="issue in group.issues"
                  :key="`${issue.kind}:${issue.entityType}:${issue.entityId ?? ''}:${issue.field ?? ''}:${issue.message}`"
                  :class="
                    issue.severity === 'error'
                      ? 'text-[var(--dm-danger)]'
                      : 'text-[var(--dm-text-muted)]'
                  "
                >
                  {{ issue.message }}
                </li>
              </ul>
            </section>
          </div>
        </section>

        <div class="flex flex-wrap justify-end gap-2">
          <p
            v-if="preview && canImport"
            class="basis-full text-right text-sm text-[var(--dm-text-muted)]"
          >
            {{
              mode === 'replaceAll'
                ? `确认后会替换当前数据，并导入 ${summary?.items ?? 0} 个服务。`
                : mode === 'additiveSkipConflicts'
                  ? `确认后会导入 ${importableSummary?.items ?? 0} 个服务，跳过 ${skippedSummary?.items ?? 0} 个服务。`
                  : `确认后会追加导入 ${summary?.items ?? 0} 个服务。`
            }}
          </p>
          <AppButton v-if="canSkipConflicts" type="button" @click="previewSkipConflicts">
            跳过冲突并导入
          </AppButton>
          <AppButton type="button" tone="primary" :disabled="!canImport" @click="executeImport">
            {{ isImporting ? '导入中...' : '确认导入' }}
          </AppButton>
        </div>
      </div>
    </section>
  </main>
</template>
