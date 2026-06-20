import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import type { Context } from 'hono'

import type { AppEnv, Bindings } from './env'
import { randomToken, sha256Base64Url } from './crypto'

export const defaultSessionTtlSeconds = 60 * 60 * 24 * 7
export const defaultSessionTouchIntervalSeconds = 60 * 5

export function getSessionCookieName(env: Pick<Bindings, 'SESSION_COOKIE_NAME'>): string {
  return env.SESSION_COOKIE_NAME || 'dockmark_session'
}

export function getSessionTtlSeconds(env: Pick<Bindings, 'SESSION_TTL_SECONDS'>): number {
  const value = Number(env.SESSION_TTL_SECONDS)
  return Number.isSafeInteger(value) && value > 0 ? value : defaultSessionTtlSeconds
}

export function getSessionTouchIntervalSeconds(
  env: Pick<Bindings, 'SESSION_TOUCH_INTERVAL_SECONDS'>,
): number {
  const value = Number(env.SESSION_TOUCH_INTERVAL_SECONDS)
  return Number.isSafeInteger(value) && value > 0 ? value : defaultSessionTouchIntervalSeconds
}

export function shouldTouchSession(
  lastSeenAt: string,
  env: Pick<Bindings, 'SESSION_TOUCH_INTERVAL_SECONDS'>,
  now = new Date(),
): boolean {
  const lastSeenTime = new Date(lastSeenAt).getTime()

  if (!Number.isFinite(lastSeenTime)) {
    return true
  }

  return now.getTime() - lastSeenTime >= getSessionTouchIntervalSeconds(env) * 1000
}

export function getSessionExpiresAt(
  env: Pick<Bindings, 'SESSION_TTL_SECONDS'>,
  now = new Date(),
): string {
  return new Date(now.getTime() + getSessionTtlSeconds(env) * 1000).toISOString()
}

export function getRequestSessionToken(c: Context<AppEnv>): string | null {
  return getCookie(c, getSessionCookieName(c.env)) ?? null
}

export function getRequestSessionTokenFromRequest(
  request: Request,
  env: Pick<Bindings, 'SESSION_COOKIE_NAME'>,
): string | null {
  const cookieHeader = request.headers.get('cookie')

  if (!cookieHeader) {
    return null
  }

  const cookieName = getSessionCookieName(env)
  const parts = cookieHeader.split(';')

  for (const part of parts) {
    const [name, ...valueParts] = part.trim().split('=')

    if (name === cookieName) {
      return decodeURIComponent(valueParts.join('='))
    }
  }

  return null
}

export async function createSessionSecret(): Promise<{
  token: string
  hash: string
}> {
  const token = randomToken(32)
  return {
    token,
    hash: await sha256Base64Url(token),
  }
}

export async function hashSessionToken(token: string): Promise<string> {
  return sha256Base64Url(token)
}

export function setSessionCookie(c: Context<AppEnv>, token: string): void {
  setCookie(c, getSessionCookieName(c.env), token, {
    httpOnly: true,
    maxAge: getSessionTtlSeconds(c.env),
    path: '/',
    sameSite: 'Lax',
    secure: new URL(c.req.url).protocol === 'https:',
  })
}

export function clearSessionCookie(c: Context<AppEnv>): void {
  deleteCookie(c, getSessionCookieName(c.env), {
    path: '/',
    secure: new URL(c.req.url).protocol === 'https:',
  })
}
