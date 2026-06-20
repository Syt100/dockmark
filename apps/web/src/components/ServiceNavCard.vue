<script setup lang="ts">
import { computed } from 'vue'

import type { NavItem } from '@dockmark/shared'

import { endpointKindLabels } from '../ui/labels'
import AppBadge from './AppBadge.vue'
import ServiceIcon from './ServiceIcon.vue'

const props = defineProps<{
  item: NavItem
}>()

const endpoints = computed(() => [props.item.primaryEndpoint, ...props.item.alternateEndpoints])

function shouldShowEndpointKind(endpoint: NavItem['primaryEndpoint']) {
  return endpoint.label !== endpointKindLabels[endpoint.kind]
}
</script>

<template>
  <article class="dm-surface p-[var(--dm-panel-padding)]">
    <div class="flex items-start justify-between gap-3">
      <div class="flex min-w-0 flex-1 items-start gap-3">
        <ServiceIcon
          :icon="item.icon"
          :icon-type="item.iconType"
          :name="item.name"
          :primary-url="item.primaryEndpoint.url"
        />
        <div class="min-w-0">
          <h3 class="truncate font-semibold text-[var(--dm-text)]">{{ item.name }}</h3>
          <p v-if="item.description" class="mt-1 text-sm leading-6 text-[var(--dm-text-muted)]">
            {{ item.description }}
          </p>
        </div>
      </div>
      <a
        class="shrink-0 whitespace-nowrap rounded-[var(--dm-radius-control)] px-3 py-1.5 text-sm font-medium text-[var(--dm-text-muted)] transition hover:bg-[var(--dm-surface-muted)] hover:text-[var(--dm-text)]"
        :href="item.primaryEndpoint.url"
        target="_blank"
      >
        打开 ↗
      </a>
    </div>

    <div class="mt-4 grid gap-2">
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
        <AppBadge
          v-if="shouldShowEndpointKind(endpoint)"
          :tone="index === 0 ? 'primary' : 'neutral'"
        >
          {{ endpointKindLabels[endpoint.kind] }}
        </AppBadge>
      </a>
    </div>

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
