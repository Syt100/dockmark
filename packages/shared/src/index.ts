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

export const apiErrorCodes = [
  'authentication_required',
  'auth_invalid_credentials',
  'auth_setup_exists',
  'auth_setup_token_invalid',
  'config_error',
  'conflict',
  'internal_error',
  'invalid_json',
  'not_found',
  'validation_failed',
] as const

export type ApiErrorCode = (typeof apiErrorCodes)[number]

export type ApiErrorResponse = {
  error: {
    code: ApiErrorCode
    message: string
    fields?: Record<string, string[]>
    requestId?: string
  }
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
