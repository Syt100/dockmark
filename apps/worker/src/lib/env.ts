import type { AuthenticatedUser } from '@dockmark/shared'

export type AuthMode = 'builtin' | 'cloudflare-access' | 'development' | 'oidc'

type GeneratedBindings = Omit<CloudflareBindings, 'AUTH_MODE'>
type WidenStringLiterals<T> = {
  [Key in keyof T]: T[Key] extends string | undefined
    ? undefined extends T[Key]
      ? string | undefined
      : string
    : T[Key]
}

export type AppVars = {
  AUTH_MODE: AuthMode
  SETUP_TOKEN?: string
  DEV_AUTH_USER_ID?: string
  DEV_AUTH_EMAIL?: string
  DEV_AUTH_NAME?: string
  ACCESS_TEAM_DOMAIN?: string
  ACCESS_AUD?: string
  SESSION_TOUCH_INTERVAL_SECONDS?: string
}

export type Bindings = WidenStringLiterals<GeneratedBindings> & AppVars

export type Variables = {
  user: AuthenticatedUser
}

export type AppEnv = {
  Bindings: Bindings
  Variables: Variables
}
