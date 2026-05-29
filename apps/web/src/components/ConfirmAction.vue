<script setup lang="ts">
import { ref } from 'vue'

import AppButton from './AppButton.vue'

withDefaults(
  defineProps<{
    label?: string
    confirmLabel?: string
    cancelLabel?: string
    message?: string
    disabled?: boolean
  }>(),
  {
    label: '删除',
    confirmLabel: '确认删除',
    cancelLabel: '取消',
    message: '确认删除？',
    disabled: false,
  },
)

const emit = defineEmits<{
  confirm: []
}>()

const isConfirming = ref(false)
</script>

<template>
  <div v-if="isConfirming" class="flex flex-wrap items-center gap-2 rounded-[var(--dm-radius-control)] bg-[var(--dm-danger-soft)] px-2 py-2">
    <span class="text-sm text-[var(--dm-danger)]">{{ message }}</span>
    <AppButton tone="danger" :disabled="disabled" @click="emit('confirm')">{{ confirmLabel }}</AppButton>
    <AppButton tone="ghost" :disabled="disabled" @click="isConfirming = false">{{ cancelLabel }}</AppButton>
  </div>
  <AppButton v-else tone="ghost" :disabled="disabled" @click="isConfirming = true">{{ label }}</AppButton>
</template>
