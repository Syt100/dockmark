import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'

import ConfirmAction from './ConfirmAction.vue'

describe('ConfirmAction', () => {
  afterEach(() => {
    document.body.innerHTML = ''
    document.body.style.overflow = ''
  })

  it('confirms destructive actions in a dialog without expanding the trigger row', async () => {
    const wrapper = mount(ConfirmAction, {
      attachTo: document.body,
      props: {
        message: '确认删除服务？',
      },
    })

    await wrapper.get('button').trigger('click')

    const dialog = document.body.querySelector('[role="dialog"]')
    expect(dialog?.textContent).toContain('确认删除服务？')
    expect(document.body.style.overflow).toBe('hidden')
    expect(wrapper.html()).not.toContain('确认删除服务？')

    const confirmButton = [...document.body.querySelectorAll('button')].find(
      (button) => button.textContent === '确认删除',
    )
    confirmButton?.click()
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('confirm')).toHaveLength(1)
    expect(document.body.querySelector('[role="dialog"]')).toBeNull()
    expect(document.body.style.overflow).toBe('')
  })
})
