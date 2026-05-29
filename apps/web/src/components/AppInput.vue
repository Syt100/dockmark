<script setup lang="ts">
defineProps<{
  modelValue: string
  required?: boolean
  type?: string
  placeholder?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

function updateValue(event: Event) {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.value)
}
</script>

<template>
  <input
    class="dm-control w-full"
    :placeholder="placeholder"
    :required="required"
    :type="type ?? 'text'"
    :value="modelValue"
    @input="updateValue"
  />
</template>
