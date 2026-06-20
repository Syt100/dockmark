import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

const replace = vi.fn<(path: string) => Promise<void>>()
const route = ref({ query: { redirect: '/services' } })

vi.mock('vue-router', () => ({
  useRoute: () => route.value,
  useRouter: () => ({ replace }),
}))

vi.mock('../auth/state', () => ({
  authMessage: (caught: unknown) => (caught instanceof Error ? caught.message : '登录失败'),
  authSetupStatus: ref(null),
  signIn: vi.fn<(input: unknown) => Promise<void>>(),
}))

import { signIn } from '../auth/state'
import LoginView from './LoginView.vue'

describe('LoginView', () => {
  beforeEach(() => {
    vi.mocked(signIn).mockReset()
    replace.mockReset()
  })

  it('submits credentials and redirects back', async () => {
    vi.mocked(signIn).mockResolvedValue()
    const wrapper = mount(LoginView)

    await wrapper.find('input[name="email"]').setValue('owner@example.com')
    await wrapper.find('input[name="password"]').setValue('correct horse battery staple')
    await wrapper.find('form').trigger('submit')

    expect(signIn).toHaveBeenCalledWith({
      email: 'owner@example.com',
      password: 'correct horse battery staple',
    })
    expect(replace).toHaveBeenCalledWith('/services')
  })

  it('shows login errors', async () => {
    vi.mocked(signIn).mockRejectedValue(new Error('邮箱或密码不正确。'))
    const wrapper = mount(LoginView)

    await wrapper.find('form').trigger('submit')

    expect(wrapper.text()).toContain('邮箱或密码不正确。')
  })
})
