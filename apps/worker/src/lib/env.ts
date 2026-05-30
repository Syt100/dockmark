import type { AuthenticatedUser } from '@dockmark/shared'

export type AuthMode = 'builtin' | 'cloudflare-access' | 'development' | 'oidc'

export type Bindings = {
  ASSETS: Fetcher
  DB: D1Database
  KV: KVNamespace
  AUTH_MODE: AuthMode
  APP_VERSION: string
  SETUP_TOKEN?: string
  SESSION_COOKIE_NAME?: string
  SESSION_TTL_SECONDS?: string
  PASSWORD_PBKDF2_ITERATIONS?: string
  DEV_AUTH_USER_ID?: string
  DEV_AUTH_EMAIL?: string
  DEV_AUTH_NAME?: string
  ACCESS_TEAM_DOMAIN?: string
  ACCESS_AUD?: string
}

export type Variables = {
  user: AuthenticatedUser
}

export type AppEnv = {
  Bindings: Bindings
  Variables: Variables
}
