<script setup lang="ts">
defineProps<{
  modelValue: string
  label: string
  placeholder: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

function updateValue(event: Event) {
  emit('update:modelValue', (event.target as HTMLInputElement).value)
}
</script>

<template>
  <input
    :aria-label="label"
    class="min-h-10 w-full rounded-md bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline outline-1 outline-slate-200 transition placeholder:text-slate-400 focus:outline-2 focus:outline-blue-500"
    :placeholder="placeholder"
    :value="modelValue"
    @input="updateValue"
  />
</template>
