import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import AboutView from './AboutView.vue'

describe('AboutView', () => {
  it('renders build metadata', () => {
    const wrapper = mount(AboutView)

    expect(wrapper.text()).toContain('版本号')
    expect(wrapper.text()).toContain('v0.1.0')
    expect(wrapper.text()).toContain('Git 提交')
    expect(wrapper.text()).toContain('test-commit')
    expect(wrapper.text()).toContain('构建时间')
    expect(wrapper.text()).toContain('2026')
  })
})
