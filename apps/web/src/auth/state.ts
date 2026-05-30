import { ref } from 'vue'
import type { AuthenticatedUser, AuthSetupStatusResponse } from '@dockmark/shared'

import {
  ApiError,
  fetchAuthSetupStatus,
  fetchCurrentUser,
  login,
  logout,
  setupBuiltinAuth,
} from '../api/client'

export const currentUser = ref<AuthenticatedUser | null>(null)
export const authSetupStatus = ref<AuthSetupStatusResponse | null>(null)
export const authLoading = ref(false)

let bootstrapPromise: Promise<void> | null = null

export function authMessage(caught: unknown, fallback: string): string {
  if (caught instanceof ApiError) {
    if (caught.code === 'auth_invalid_credentials') {
      return '邮箱或密码不正确。'
    }

    if (caught.code === 'auth_setup_token_invalid') {
      return '初始化令牌不正确。'
    }

    if (caught.code === 'auth_setup_exists') {
      return '管理员已经初始化，请直接登录。'
    }

    if (caught.code === 'validation_failed' && caught.message.includes('password must be at least 12 characters')) {
      return '密码至少需要 12 个字符。'
    }

    if (caught.code === 'validation_failed' && caught.message.includes('email must be valid')) {
      return '请输入有效邮箱。'
    }

    if (caught.code === 'config_error') {
      if (caught.message.includes('SETUP_TOKEN is required')) {
        return '服务端未配置 SETUP_TOKEN，无法初始化管理员。'
      }

      if (caught.message.includes('Use AUTH_MODE=builtin')) {
        return '当前认证模式尚未实现，请将 AUTH_MODE 设置为 builtin。'
      }
    }
  }

  const message = caught instanceof Error ? caught.message : ''

  if (!message) {
    return fallback
  }

  if (message.includes('Invalid email or password')) {
    return '邮箱或密码不正确。'
  }

  if (message.includes('Setup token is invalid')) {
    return '初始化令牌不正确。'
  }

  if (message.includes('Administrator is already configured')) {
    return '管理员已经初始化，请直接登录。'
  }

  if (message.includes('SETUP_TOKEN is required')) {
    return '服务端未配置 SETUP_TOKEN，无法初始化管理员。'
  }

  if (message.includes('password must be at least 12 characters')) {
    return '密码至少需要 12 个字符。'
  }

  if (message.includes('email must be valid')) {
    return '请输入有效邮箱。'
  }

  if (message.includes('Use AUTH_MODE=builtin')) {
    return '当前认证模式尚未实现，请将 AUTH_MODE 设置为 builtin。'
  }

  return `${fallback}：${message}`
}

export function isUnauthenticated(caught: unknown): boolean {
  return caught instanceof ApiError && caught.status === 401
}

export function clearAuthBootstrap(): void {
  bootstrapPromise = null
}

export async function loadAuthState(): Promise<void> {
  authLoading.value = true

  try {
    const setupStatus = await fetchAuthSetupStatus()
    authSetupStatus.value = setupStatus

    if (!setupStatus.supported || setupStatus.needsSetup) {
      currentUser.value = null
      return
    }

    const response = await fetchCurrentUser()
    currentUser.value = response.user
  } catch (caught) {
    if (isUnauthenticated(caught)) {
      currentUser.value = null
      return
    }

    throw caught
  } finally {
    authLoading.value = false
  }
}

export function ensureAuthState(): Promise<void> {
  bootstrapPromise ??= loadAuthState()
  return bootstrapPromise
}

export async function setupAndSignIn(input: Parameters<typeof setupBuiltinAuth>[0]): Promise<void> {
  const response = await setupBuiltinAuth(input)
  currentUser.value = response.user
  clearAuthBootstrap()
  await loadAuthState()
}

export async function signIn(input: Parameters<typeof login>[0]): Promise<void> {
  const response = await login(input)
  currentUser.value = response.user
  clearAuthBootstrap()
  await loadAuthState()
}

export async function signOut(): Promise<void> {
  await logout()
  currentUser.value = null
  clearAuthBootstrap()
  await loadAuthState()
}
