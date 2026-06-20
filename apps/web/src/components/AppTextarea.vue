<script setup lang="ts">
defineOptions({
  inheritAttrs: false,
})

defineProps<{
  modelValue: string
  placeholder?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

function updateValue(event: Event) {
  emit('update:modelValue', (event.target as HTMLTextAreaElement).value)
}
</script>

<template>
  <textarea
    v-bind="$attrs"
    class="dm-control min-h-24 w-full resize-y"
    :placeholder="placeholder"
    :value="modelValue"
    @input="updateValue"
  ></textarea>
</template>
