import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import AppInput from './AppInput.vue'

describe('AppInput', () => {
  it('emits numeric values for number inputs', async () => {
    const wrapper = mount(AppInput, {
      props: {
        modelValue: 1,
        type: 'number',
      },
    })

    await wrapper.get('input').setValue('42')

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([42])
  })

  it('passes through common input attributes with control styling', () => {
    const wrapper = mount(AppInput, {
      props: {
        modelValue: '',
        name: 'email',
        required: true,
        type: 'email',
        placeholder: 'owner@example.com',
      },
      attrs: {
        'aria-label': '邮箱',
        autocomplete: 'email',
        minlength: '3',
      },
    })

    const input = wrapper.get('input')

    expect(input.attributes('class')).toContain('dm-control')
    expect(input.attributes('aria-label')).toBe('邮箱')
    expect(input.attributes('autocomplete')).toBe('email')
    expect(input.attributes('minlength')).toBe('3')
    expect(input.attributes('name')).toBe('email')
    expect(input.attributes('required')).toBeDefined()
    expect(input.attributes('type')).toBe('email')
    expect(input.attributes('placeholder')).toBe('owner@example.com')
  })
})
