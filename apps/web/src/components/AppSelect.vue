<script setup lang="ts">
defineProps<{
  modelValue: string
  name?: string
  required?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

function updateValue(event: Event) {
  emit('update:modelValue', (event.target as HTMLSelectElement).value)
}
</script>

<template>
  <select class="dm-control w-full" :name="name" :required="required" :value="modelValue" @change="updateValue">
    <slot />
  </select>
</template>
