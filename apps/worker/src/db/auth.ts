import { createId, type AuthenticatedUser } from '@dockmark/shared'

import type { AuthMode } from '../lib/env'

export type AuthUserRow = {
  id: string
  email: string
  display_name: string | null
  password_hash: string
  password_algo: string
  is_admin: number
  disabled_at: string | null
  created_at: string
  updated_at: string
  last_login_at: string | null
}

export type AuthSessionRow = {
  id: string
  user_id: string
  session_hash: string
  expires_at: string
  created_at: string
  last_seen_at: string
  revoked_at: string | null
}

export type AuthenticatedSession = {
  session: AuthSessionRow
  user: AuthUserRow
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function mapAuthUser(row: AuthUserRow, mode: AuthMode): AuthenticatedUser {
  return {
    id: row.id,
    email: row.email,
    name: row.display_name ?? undefined,
    mode,
  }
}

export async function countAuthUsers(db: D1Database): Promise<number> {
  const row = await db
    .prepare('SELECT COUNT(*) AS count FROM auth_users')
    .first<{ count: number }>()
  return row?.count ?? 0
}

export async function getAuthUserByEmail(
  db: D1Database,
  email: string,
): Promise<AuthUserRow | null> {
  return db
    .prepare('SELECT * FROM auth_users WHERE email = ?')
    .bind(normalizeEmail(email))
    .first<AuthUserRow>()
}

export async function createAuthUser(
  db: D1Database,
  input: {
    email: string
    displayName: string | null
    passwordHash: string
    passwordAlgo: string
  },
): Promise<AuthUserRow> {
  const id = createId('user')

  await db
    .prepare(
      `INSERT INTO auth_users (id, email, display_name, password_hash, password_algo)
       VALUES (?, ?, ?, ?, ?)`,
    )
    .bind(
      id,
      normalizeEmail(input.email),
      input.displayName,
      input.passwordHash,
      input.passwordAlgo,
    )
    .run()

  const user = await db
    .prepare('SELECT * FROM auth_users WHERE id = ?')
    .bind(id)
    .first<AuthUserRow>()

  if (!user) {
    throw new Error('Created auth user could not be loaded')
  }

  return user
}

export async function markAuthUserLogin(db: D1Database, userId: string): Promise<void> {
  await db
    .prepare(
      'UPDATE auth_users SET last_login_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    )
    .bind(userId)
    .run()
}

export async function createAuthSession(
  db: D1Database,
  input: {
    userId: string
    sessionHash: string
    expiresAt: string
  },
): Promise<AuthSessionRow> {
  const id = createId('sess')

  await db
    .prepare(
      `INSERT INTO auth_sessions (id, user_id, session_hash, expires_at)
       VALUES (?, ?, ?, ?)`,
    )
    .bind(id, input.userId, input.sessionHash, input.expiresAt)
    .run()

  const session = await db
    .prepare('SELECT * FROM auth_sessions WHERE id = ?')
    .bind(id)
    .first<AuthSessionRow>()

  if (!session) {
    throw new Error('Created auth session could not be loaded')
  }

  return session
}

export async function getAuthenticatedSession(
  db: D1Database,
  sessionHash: string,
  now = new Date(),
): Promise<AuthenticatedSession | null> {
  const row = await db
    .prepare(
      `SELECT
         auth_sessions.id AS session_id,
         auth_sessions.user_id,
         auth_sessions.session_hash,
         auth_sessions.expires_at,
         auth_sessions.created_at AS session_created_at,
         auth_sessions.last_seen_at,
         auth_sessions.revoked_at,
         auth_users.id AS user_id_value,
         auth_users.email,
         auth_users.display_name,
         auth_users.password_hash,
         auth_users.password_algo,
         auth_users.is_admin,
         auth_users.disabled_at,
         auth_users.created_at AS user_created_at,
         auth_users.updated_at,
         auth_users.last_login_at
       FROM auth_sessions
       JOIN auth_users ON auth_users.id = auth_sessions.user_id
       WHERE auth_sessions.session_hash = ?`,
    )
    .bind(sessionHash)
    .first<{
      session_id: string
      user_id: string
      session_hash: string
      expires_at: string
      session_created_at: string
      last_seen_at: string
      revoked_at: string | null
      user_id_value: string
      email: string
      display_name: string | null
      password_hash: string
      password_algo: string
      is_admin: number
      disabled_at: string | null
      user_created_at: string
      updated_at: string
      last_login_at: string | null
    }>()

  if (
    !row ||
    row.revoked_at ||
    row.disabled_at ||
    new Date(row.expires_at).getTime() <= now.getTime()
  ) {
    return null
  }

  return {
    session: {
      id: row.session_id,
      user_id: row.user_id,
      session_hash: row.session_hash,
      expires_at: row.expires_at,
      created_at: row.session_created_at,
      last_seen_at: row.last_seen_at,
      revoked_at: row.revoked_at,
    },
    user: {
      id: row.user_id_value,
      email: row.email,
      display_name: row.display_name,
      password_hash: row.password_hash,
      password_algo: row.password_algo,
      is_admin: row.is_admin,
      disabled_at: row.disabled_at,
      created_at: row.user_created_at,
      updated_at: row.updated_at,
      last_login_at: row.last_login_at,
    },
  }
}

export async function touchAuthSession(db: D1Database, sessionId: string): Promise<void> {
  await db
    .prepare(
      'UPDATE auth_sessions SET last_seen_at = CURRENT_TIMESTAMP WHERE id = ? AND revoked_at IS NULL',
    )
    .bind(sessionId)
    .run()
}

export async function revokeAuthSession(db: D1Database, sessionHash: string): Promise<void> {
  await db
    .prepare(
      'UPDATE auth_sessions SET revoked_at = CURRENT_TIMESTAMP WHERE session_hash = ? AND revoked_at IS NULL',
    )
    .bind(sessionHash)
    .run()
}
