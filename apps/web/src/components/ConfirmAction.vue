<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'

import AppButton from './AppButton.vue'

withDefaults(
  defineProps<{
    label?: string
    confirmLabel?: string
    cancelLabel?: string
    message?: string
    size?: 'sm' | 'md'
    disabled?: boolean
  }>(),
  {
    label: '删除',
    confirmLabel: '确认删除',
    cancelLabel: '取消',
    message: '确认删除？',
    size: 'md',
    disabled: false,
  },
)

const emit = defineEmits<{
  confirm: []
}>()

const isConfirming = ref(false)
const confirmButton = ref<InstanceType<typeof AppButton> | null>(null)
let originalBodyOverflow = ''

async function openConfirm() {
  isConfirming.value = true
  await nextTick()
  const button = confirmButton.value?.$el as HTMLButtonElement | undefined
  button?.focus()
}

function closeConfirm() {
  isConfirming.value = false
}

function confirm() {
  emit('confirm')
  closeConfirm()
}

function lockBodyScroll() {
  if (typeof document === 'undefined') {
    return
  }

  originalBodyOverflow = document.body.style.overflow
  document.body.style.overflow = 'hidden'
}

function unlockBodyScroll() {
  if (typeof document === 'undefined') {
    return
  }

  document.body.style.overflow = originalBodyOverflow
}

watch(isConfirming, (value) => {
  if (value) {
    lockBodyScroll()
  } else {
    unlockBodyScroll()
  }
})

onBeforeUnmount(unlockBodyScroll)
</script>

<template>
  <span class="relative inline-flex">
    <AppButton tone="ghost" :size="size" :disabled="disabled" @click="openConfirm">{{ label }}</AppButton>
  </span>

  <Teleport to="body">
    <Transition name="dm-panel">
      <div v-if="isConfirming" class="fixed inset-0 z-50 grid place-items-center p-4" @keydown.esc.stop.prevent="closeConfirm">
        <button class="absolute inset-0 cursor-default bg-[var(--dm-overlay)]" type="button" aria-label="取消删除" @click="closeConfirm"></button>
        <section
          class="relative grid w-[min(22rem,calc(100vw-2rem))] gap-4 rounded-[var(--dm-radius-surface)] border border-[var(--dm-border)] bg-[var(--dm-surface-elevated)] p-4 text-left shadow-[var(--dm-shadow-elevated)]"
          role="dialog"
          aria-modal="true"
          aria-label="确认删除"
        >
          <p class="text-sm leading-6 text-[var(--dm-text)]">{{ message }}</p>
          <div class="flex justify-end gap-2">
            <AppButton type="button" tone="ghost" :disabled="disabled" @click="closeConfirm">{{ cancelLabel }}</AppButton>
            <AppButton ref="confirmButton" type="button" tone="danger" :disabled="disabled" @click="confirm">{{ confirmLabel }}</AppButton>
          </div>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>
