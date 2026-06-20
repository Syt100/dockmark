import type { AuthenticatedUser } from '@dockmark/shared'

import { getAuthenticatedSession, mapAuthUser, touchAuthSession } from '../db/auth'
import type { Bindings } from './env'
import { apiError } from './errors'
import { getRequestSessionTokenFromRequest, hashSessionToken, shouldTouchSession } from './session'

type AuthAdapter = {
  authenticate(request: Request): Promise<AuthenticatedUser>
}

class DevelopmentAuthAdapter implements AuthAdapter {
  constructor(private readonly env: Bindings) {}

  async authenticate(): Promise<AuthenticatedUser> {
    if (this.env.AUTH_MODE !== 'development') {
      throw apiError(500, 'internal_error', 'Development auth adapter is not enabled')
    }

    return {
      id: this.env.DEV_AUTH_USER_ID ?? 'dev-user',
      email: this.env.DEV_AUTH_EMAIL ?? 'dev@dockmark.local',
      name: this.env.DEV_AUTH_NAME ?? 'Dockmark Developer',
      mode: 'development',
    }
  }
}

class BuiltinAuthAdapter implements AuthAdapter {
  constructor(private readonly env: Bindings) {}

  async authenticate(request: Request): Promise<AuthenticatedUser> {
    const token = getRequestSessionTokenFromRequest(request, this.env)

    if (!token) {
      throw apiError(401, 'authentication_required', 'Authentication required')
    }

    const session = await getAuthenticatedSession(this.env.DB, await hashSessionToken(token))

    if (!session) {
      throw apiError(401, 'authentication_required', 'Session is expired or invalid')
    }

    if (shouldTouchSession(session.session.last_seen_at, this.env)) {
      await touchAuthSession(this.env.DB, session.session.id)
    }

    return mapAuthUser(session.user, 'builtin')
  }
}

class CloudflareAccessAuthAdapter implements AuthAdapter {
  async authenticate(): Promise<AuthenticatedUser> {
    throw apiError(
      503,
      'config_error',
      'Cloudflare Access authentication is reserved but not implemented securely yet. Use AUTH_MODE=builtin.',
    )
  }
}

class OidcAuthAdapter implements AuthAdapter {
  async authenticate(): Promise<AuthenticatedUser> {
    throw apiError(
      503,
      'config_error',
      'OIDC authentication is reserved but not implemented yet. Use AUTH_MODE=builtin.',
    )
  }
}

export function createAuthAdapter(env: Bindings): AuthAdapter {
  if (env.AUTH_MODE === 'builtin') {
    return new BuiltinAuthAdapter(env)
  }

  if (env.AUTH_MODE === 'cloudflare-access') {
    return new CloudflareAccessAuthAdapter()
  }

  if (env.AUTH_MODE === 'oidc') {
    return new OidcAuthAdapter()
  }

  if (env.AUTH_MODE === 'development') {
    return new DevelopmentAuthAdapter(env)
  }

  throw apiError(500, 'internal_error', `Unsupported auth mode: ${env.AUTH_MODE}`)
}
