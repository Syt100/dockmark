import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import SearchInput from './SearchInput.vue'

describe('SearchInput', () => {
  it('emits typed values with the shared control class', async () => {
    const wrapper = mount(SearchInput, {
      props: {
        modelValue: '',
        label: '搜索服务',
        placeholder: '服务、URL 或标签',
      },
    })

    const input = wrapper.get('input')
    expect(input.attributes('aria-label')).toBe('搜索服务')
    expect(input.classes()).toContain('dm-control')

    await input.setValue('immich')

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['immich'])
  })
})
