import type { AuthenticatedUser } from '@dockmark/shared'

export type AuthMode = 'development' | 'cloudflare-access'

export type Bindings = {
  ASSETS: Fetcher
  DB: D1Database
  KV: KVNamespace
  AUTH_MODE: AuthMode
  APP_VERSION: string
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

