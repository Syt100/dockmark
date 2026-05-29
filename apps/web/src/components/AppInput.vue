<script setup lang="ts">
defineOptions({
  inheritAttrs: false,
})

defineProps<{
  modelValue: number | string
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
    v-bind="$attrs"
    class="dm-control w-full"
    :placeholder="placeholder"
    :required="required"
    :type="type ?? 'text'"
    :value="modelValue"
    @input="updateValue"
  />
</template>
