<script setup lang="ts">
defineOptions({
  inheritAttrs: false,
})

defineProps<{
  modelValue: string
  label: string
  name?: string
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
    v-bind="$attrs"
    :aria-label="label"
    class="dm-control w-full"
    type="search"
    :name="name"
    :placeholder="placeholder"
    :value="modelValue"
    @input="updateValue"
  />
</template>
