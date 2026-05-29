import { HTTPException } from 'hono/http-exception'

import type { AppEnv } from './env'

type ContextLike = {
  req: {
    json(): Promise<unknown>
  }
}

export async function readJson(c: ContextLike): Promise<unknown> {
  try {
    return await c.req.json()
  } catch {
    throw new HTTPException(400, { message: 'Request body must be valid JSON' })
  }
}

export function requireValidation<T>(
  result: { ok: true; value: T } | { ok: false; errors: string[] },
): T {
  if (result.ok) {
    return result.value
  }

  throw new HTTPException(400, { message: result.errors.join('; ') })
}

export async function requireUser(c: {
  get(name: 'user'): AppEnv['Variables']['user'] | undefined
}): Promise<AppEnv['Variables']['user']> {
  const user = c.get('user')

  if (!user) {
    throw new HTTPException(401, { message: 'Authentication required' })
  }

  return user
}

