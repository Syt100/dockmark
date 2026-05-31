<script setup lang="ts">
defineOptions({
  inheritAttrs: false,
})

defineProps<{
  modelValue: number | string
  name?: string
  required?: boolean
  type?: string
  placeholder?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: number | string]
}>()

function updateValue(event: Event) {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.type === 'number' ? target.valueAsNumber : target.value)
}
</script>

<template>
  <input
    v-bind="$attrs"
    class="dm-control w-full"
    :name="name"
    :placeholder="placeholder"
    :required="required"
    :type="type ?? 'text'"
    :value="modelValue"
    @input="updateValue"
  />
</template>
