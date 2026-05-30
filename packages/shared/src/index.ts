export type HealthResponse = {
  ok: true
  service: 'dockmark-worker'
  version: string
}

export type SmokeResponse = {
  ok: true
  d1: 'reachable'
  kv: 'reachable'
}

export type AuthMode = 'builtin' | 'cloudflare-access' | 'development' | 'oidc'

export type AuthenticatedUser = {
  id: string
  email?: string
  name?: string
  mode: AuthMode
}

export type AuthSetupStatusResponse = {
  authMode: AuthMode
  needsSetup: boolean
  supported: boolean
  message?: string
}

export type AuthSetupRequest = {
  setupToken: string
  email: string
  password: string
  name?: string
}

export type AuthLoginRequest = {
  email: string
  password: string
}

export type AuthUserResponse = {
  user: AuthenticatedUser | null
}

export type AuthSuccessResponse = {
  user: AuthenticatedUser
}

export * from './navigation'
