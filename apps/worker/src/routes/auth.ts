import { Hono } from 'hono'
import type { Context } from 'hono'
import type {
  AuthLoginRequest,
  AuthSetupRequest,
  AuthSetupStatusResponse,
  AuthSuccessResponse,
  AuthUserResponse,
} from '@dockmark/shared'

import {
  countAuthUsers,
  createAuthSession,
  createAuthUser,
  getAuthUserByEmail,
  mapAuthUser,
  normalizeEmail,
  revokeAuthSession,
  markAuthUserLogin,
} from '../db/auth'
import { createPasswordVerifier, defaultPbkdf2Iterations, timingSafeEqual, verifyPassword } from '../lib/crypto'
import { apiError } from '../lib/errors'
import { createAuthAdapter } from '../lib/auth'
import type { AppEnv } from '../lib/env'
import { readJson } from '../lib/http'
import {
  clearSessionCookie,
  createSessionSecret,
  getRequestSessionToken,
  getSessionExpiresAt,
  hashSessionToken,
  setSessionCookie,
} from '../lib/session'

export const authRoute = new Hono<AppEnv>()

function unsupportedModeMessage(authMode: AppEnv['Bindings']['AUTH_MODE']): string | undefined {
  if (authMode === 'oidc') {
    return 'OIDC authentication is reserved but not implemented yet. Use AUTH_MODE=builtin.'
  }

  if (authMode === 'cloudflare-access') {
    return 'Cloudflare Access authentication is reserved but not implemented securely yet. Use AUTH_MODE=builtin.'
  }

  return undefined
}

function requireBuiltinMode(authMode: AppEnv['Bindings']['AUTH_MODE']): void {
  const message = unsupportedModeMessage(authMode)

  if (message) {
    throw apiError(503, 'config_error', message)
  }

  if (authMode !== 'builtin') {
    throw apiError(400, 'config_error', 'Built-in authentication is not enabled')
  }
}

function parsePositiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number(value)
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback
}

function requireString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw apiError(400, 'validation_failed', `${field} is required`, {
      [field]: [`${field} is required`],
    })
  }

  return value.trim()
}

function optionalString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : null
}

function requireEmail(value: unknown): string {
  const email = normalizeEmail(requireString(value, 'email'))

  if (!email.includes('@') || email.length > 254) {
    throw apiError(400, 'validation_failed', 'email must be valid', {
      email: ['email must be valid'],
    })
  }

  return email
}

function requirePassword(value: unknown): string {
  const password = requireString(value, 'password')

  if (password.length < 12) {
    throw apiError(400, 'validation_failed', 'password must be at least 12 characters', {
      password: ['password must be at least 12 characters'],
    })
  }

  return password
}

async function createLoginSession(c: Context<AppEnv>, userId: string) {
  const secret = await createSessionSecret()
  await createAuthSession(c.env.DB, {
    userId,
    sessionHash: secret.hash,
    expiresAt: getSessionExpiresAt(c.env),
  })
  setSessionCookie(c, secret.token)
}

authRoute.get('/setup', async (c) => {
  const message = unsupportedModeMessage(c.env.AUTH_MODE)
  const body: AuthSetupStatusResponse = {
    authMode: c.env.AUTH_MODE,
    needsSetup: c.env.AUTH_MODE === 'builtin' ? (await countAuthUsers(c.env.DB)) === 0 : false,
    supported: !message,
    message,
  }

  return c.json(body)
})

authRoute.post('/setup', async (c) => {
  requireBuiltinMode(c.env.AUTH_MODE)

  if ((await countAuthUsers(c.env.DB)) > 0) {
    throw apiError(409, 'auth_setup_exists', 'Administrator is already configured')
  }

  const setupToken = c.env.SETUP_TOKEN

  if (!setupToken) {
    throw apiError(503, 'config_error', 'SETUP_TOKEN is required before creating the administrator')
  }

  const body = await readJson(c) as Partial<AuthSetupRequest>
  const submittedToken = requireString(body.setupToken, 'setupToken')

  if (!timingSafeEqual(setupToken, submittedToken)) {
    throw apiError(401, 'auth_setup_token_invalid', 'Setup token is invalid')
  }

  const email = requireEmail(body.email)
  const password = requirePassword(body.password)
  const name = optionalString(body.name)
  const verifier = await createPasswordVerifier(password, {
    iterations: parsePositiveInteger(c.env.PASSWORD_PBKDF2_ITERATIONS, defaultPbkdf2Iterations),
  })
  const user = await createAuthUser(c.env.DB, {
    email,
    displayName: name,
    passwordHash: verifier.hash,
    passwordAlgo: verifier.algo,
  })
  const response: AuthSuccessResponse = {
    user: mapAuthUser(user, 'builtin'),
  }

  await markAuthUserLogin(c.env.DB, user.id)
  await createLoginSession(c, user.id)

  return c.json(response, 201)
})

authRoute.post('/login', async (c) => {
  requireBuiltinMode(c.env.AUTH_MODE)

  const body = await readJson(c) as Partial<AuthLoginRequest>
  const email = requireEmail(body.email)
  const password = requireString(body.password, 'password')
  const user = await getAuthUserByEmail(c.env.DB, email)

  if (!user || user.disabled_at || !(await verifyPassword(password, user.password_hash))) {
    throw apiError(401, 'auth_invalid_credentials', 'Invalid email or password')
  }
  const response: AuthSuccessResponse = {
    user: mapAuthUser(user, 'builtin'),
  }

  await markAuthUserLogin(c.env.DB, user.id)
  await createLoginSession(c, user.id)

  return c.json(response)
})

authRoute.post('/logout', async (c) => {
  const token = getRequestSessionToken(c)

  if (token) {
    await revokeAuthSession(c.env.DB, await hashSessionToken(token))
  }

  clearSessionCookie(c)
  return c.body(null, 204)
})

export async function currentUserHandler(c: Context<AppEnv>) {
  if (c.env.AUTH_MODE === 'builtin') {
    const token = getRequestSessionToken(c)

    if (!token) {
      const response: AuthUserResponse = { user: null }
      return c.json(response)
    }
  }

  const auth = createAuthAdapter(c.env)
  const user = await auth.authenticate(c.req.raw)
  const response: AuthUserResponse = {
    user,
  }

  return c.json(response)
}

authRoute.get('/me', currentUserHandler)
