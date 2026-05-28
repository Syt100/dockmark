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

export type AuthMode = 'cloudflare-access' | 'development'

export type AuthenticatedUser = {
  id: string
  email?: string
  name?: string
  mode: AuthMode
}

