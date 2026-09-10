<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, type RouteLocationRaw } from 'vue-router'

import type { ServiceItem } from '@dockmark/shared'

import { endpointKindLabels, statusLabels, statusToneClasses } from '../ui/labels'
import AppBadge from './AppBadge.vue'
import ServiceIcon from './ServiceIcon.vue'

const props = defineProps<{
  item: ServiceItem
  editTo: RouteLocationRaw
}>()

const primaryEndpoint = computed(
  () => props.item.endpoints.find((endpoint) => endpoint.isPrimary) ?? props.item.endpoints[0] ?? null,
)
const endpoints = computed(() => {
  const primary = primaryEndpoint.value

  if (!primary) {
    return props.item.endpoints
  }

  return [primary, ...props.item.endpoints.filter((endpoint) => endpoint.id !== primary.id)]
})

function shouldShowEndpointKind(endpoint: ServiceItem['endpoints'][number]) {
  return endpoint.label !== endpointKindLabels[endpoint.kind]
}
</script>

<template>
  <article
    :class="[
      'dm-surface p-[var(--dm-panel-padding)]',
      item.status === 'hidden' ? 'opacity-75' : '',
      item.status === 'archived' ? 'opacity-60' : '',
    ]"
  >
    <div class="flex items-start justify-between gap-3">
      <div class="flex min-w-0 flex-1 items-start gap-3">
        <ServiceIcon
          :icon="item.icon"
          :icon-type="item.iconType"
          :name="item.name"
          :primary-url="primaryEndpoint?.url ?? null"
        />
        <div class="min-w-0">
          <div class="flex min-w-0 items-center gap-2">
            <h3 class="truncate font-semibold text-[var(--dm-text)]">{{ item.name }}</h3>
            <span
              v-if="item.status !== 'active'"
              :class="[
                'shrink-0 rounded-[var(--dm-radius-full)] px-2 py-0.5 text-xs font-medium',
                statusToneClasses[item.status],
              ]"
            >
              {{ statusLabels[item.status] }}
            </span>
          </div>
          <p v-if="item.description" class="mt-1 text-sm leading-6 text-[var(--dm-text-muted)]">
            {{ item.description }}
          </p>
        </div>
      </div>

      <div class="flex shrink-0 items-center gap-1">
        <RouterLink
          :to="editTo"
          aria-label="编辑服务"
          class="inline-flex h-9 w-9 items-center justify-center rounded-[var(--dm-radius-control)] text-[var(--dm-text-muted)] transition active:scale-[0.96] hover:bg-[var(--dm-surface-muted)] hover:text-[var(--dm-text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--dm-focus)] motion-reduce:active:scale-100"
          title="编辑服务"
        >
          <svg
            aria-hidden="true"
            class="h-4 w-4"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="m13.5 3.5 3 3L7 16H4v-3l9.5-9.5Z" />
            <path d="m11.5 5.5 3 3" />
          </svg>
        </RouterLink>
        <a
          v-if="primaryEndpoint"
          class="whitespace-nowrap rounded-[var(--dm-radius-control)] px-3 py-1.5 text-sm font-medium text-[var(--dm-text-muted)] transition hover:bg-[var(--dm-surface-muted)] hover:text-[var(--dm-text)]"
          :href="primaryEndpoint.url"
          target="_blank"
        >
          打开 ↗
        </a>
      </div>
    </div>

    <div v-if="endpoints.length > 0" class="mt-4 grid gap-2">
      <a
        v-for="(endpoint, index) in endpoints"
        :key="endpoint.id"
        :class="[
          'grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-[var(--dm-radius-control)] px-2 py-1.5 text-sm transition hover:bg-[var(--dm-surface-muted)]',
          index === 0
            ? 'text-[var(--dm-primary)]'
            : 'text-[var(--dm-text-muted)] hover:text-[var(--dm-text)]',
        ]"
        :href="endpoint.url"
        target="_blank"
      >
        <span class="min-w-0 truncate font-medium">{{ endpoint.label }}</span>
        <AppBadge v-if="shouldShowEndpointKind(endpoint)" :tone="index === 0 ? 'primary' : 'neutral'">
          {{ endpointKindLabels[endpoint.kind] }}
        </AppBadge>
      </a>
    </div>
    <p v-else class="mt-4 text-sm text-[var(--dm-text-subtle)]">未配置地址</p>

    <p
      v-if="item.credentialHint"
      class="mt-4 rounded-[var(--dm-radius-control)] bg-[var(--dm-surface-muted)] p-2 text-xs leading-5 text-[var(--dm-text-muted)]"
    >
      {{ item.credentialHint }}
    </p>

    <div v-if="item.tags.length > 0" class="mt-3 flex flex-wrap gap-2">
      <AppBadge v-for="tag in item.tags" :key="tag.id">{{ tag.name }}</AppBadge>
    </div>
  </article>
</template>
