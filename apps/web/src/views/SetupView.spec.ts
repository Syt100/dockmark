import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const replace = vi.fn<(path: string) => Promise<void>>()

vi.mock('vue-router', () => ({
  useRouter: () => ({ replace }),
}))

vi.mock('../auth/state', () => ({
  authMessage: (caught: unknown) => caught instanceof Error ? caught.message : '初始化失败',
  setupAndSignIn: vi.fn<(input: unknown) => Promise<void>>(),
}))

import { setupAndSignIn } from '../auth/state'
import SetupView from './SetupView.vue'

describe('SetupView', () => {
  beforeEach(() => {
    vi.mocked(setupAndSignIn).mockReset()
    replace.mockReset()
  })

  it('creates the administrator and opens the app', async () => {
    vi.mocked(setupAndSignIn).mockResolvedValue()
    const wrapper = mount(SetupView)

    await wrapper.find('input[name="setup-token"]').setValue('setup-secret')
    await wrapper.find('input[name="email"]').setValue('owner@example.com')
    await wrapper.find('input[name="name"]').setValue('Owner')
    await wrapper.find('input[name="password"]').setValue('correct horse battery staple')
    await wrapper.find('form').trigger('submit')

    expect(setupAndSignIn).toHaveBeenCalledWith({
      setupToken: 'setup-secret',
      email: 'owner@example.com',
      name: 'Owner',
      password: 'correct horse battery staple',
    })
    expect(replace).toHaveBeenCalledWith('/')
  })

  it('shows setup errors', async () => {
    vi.mocked(setupAndSignIn).mockRejectedValue(new Error('初始化令牌不正确。'))
    const wrapper = mount(SetupView)

    await wrapper.find('form').trigger('submit')

    expect(wrapper.text()).toContain('初始化令牌不正确。')
  })
})
