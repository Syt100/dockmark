<script setup lang="ts">
import type { NavItem } from '@dockmark/shared'

import { endpointKindLabels } from '../ui/labels'
import AppBadge from './AppBadge.vue'

defineProps<{
  item: NavItem
}>()
</script>

<template>
  <article class="dm-surface p-[var(--dm-panel-padding)]">
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0">
        <h3 class="font-semibold text-[var(--dm-text)]">{{ item.icon || '•' }} {{ item.name }}</h3>
        <p v-if="item.description" class="mt-1 text-sm leading-6 text-[var(--dm-text-muted)]">{{ item.description }}</p>
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
      <a class="dm-link break-all text-sm" :href="item.primaryEndpoint.url" target="_blank">
        {{ item.primaryEndpoint.label }} · {{ endpointKindLabels[item.primaryEndpoint.kind] }}
      </a>
      <a
        v-for="endpoint in item.alternateEndpoints"
        :key="endpoint.id"
        class="break-all text-sm text-[var(--dm-text-muted)] hover:text-[var(--dm-text)]"
        :href="endpoint.url"
        target="_blank"
      >
        {{ endpoint.label }} · {{ endpointKindLabels[endpoint.kind] }}
      </a>
    </div>

    <p v-if="item.credentialHint" class="mt-4 rounded-[var(--dm-radius-control)] bg-[var(--dm-surface-muted)] p-2 text-xs leading-5 text-[var(--dm-text-muted)]">
      {{ item.credentialHint }}
    </p>

    <div v-if="item.tags.length > 0" class="mt-3 flex flex-wrap gap-2">
      <AppBadge v-for="tag in item.tags" :key="tag.id">{{ tag.name }}</AppBadge>
    </div>
  </article>
</template>
