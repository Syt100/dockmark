import { HTTPException } from 'hono/http-exception'

import type { AuthenticatedUser } from '@dockmark/shared'

import type { Bindings } from './env'

type AuthAdapter = {
  authenticate(request: Request): Promise<AuthenticatedUser>
}

class DevelopmentAuthAdapter implements AuthAdapter {
  constructor(private readonly env: Bindings) {}

  async authenticate(): Promise<AuthenticatedUser> {
    if (this.env.AUTH_MODE !== 'development') {
      throw new HTTPException(500, { message: 'Development auth adapter is not enabled' })
    }

    return {
      id: this.env.DEV_AUTH_USER_ID ?? 'dev-user',
      email: this.env.DEV_AUTH_EMAIL ?? 'dev@dockmark.local',
      name: this.env.DEV_AUTH_NAME ?? 'Dockmark Developer',
      mode: 'development',
    }
  }
}

class CloudflareAccessAuthAdapter implements AuthAdapter {
  async authenticate(request: Request): Promise<AuthenticatedUser> {
    const email = request.headers.get('Cf-Access-Authenticated-User-Email')
    const subject = request.headers.get('Cf-Access-Authenticated-User-Id') ?? email
    const assertion = request.headers.get('Cf-Access-Jwt-Assertion')

    if (!email || !subject || !assertion) {
      throw new HTTPException(401, { message: 'Cloudflare Access identity is required' })
    }

    // Phase 0 keeps JWT validation behind this adapter boundary. Production hardening
    // should verify Cf-Access-Jwt-Assertion with the Access team public keys.
    return {
      id: subject,
      email,
      mode: 'cloudflare-access',
    }
  }
}

export function createAuthAdapter(env: Bindings): AuthAdapter {
  if (env.AUTH_MODE === 'cloudflare-access') {
    return new CloudflareAccessAuthAdapter()
  }

  if (env.AUTH_MODE === 'development') {
    return new DevelopmentAuthAdapter(env)
  }

  throw new HTTPException(500, { message: `Unsupported auth mode: ${env.AUTH_MODE}` })
}

