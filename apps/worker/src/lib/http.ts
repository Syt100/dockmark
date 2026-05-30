import type { AppEnv } from './env'
import { apiError } from './errors'

type ContextLike = {
  req: {
    json(): Promise<unknown>
  }
}

export async function readJson(c: ContextLike): Promise<unknown> {
  try {
    return await c.req.json()
  } catch {
    throw apiError(400, 'invalid_json', 'Request body must be valid JSON')
  }
}

export function requireValidation<T>(
  result: { ok: true; value: T } | { ok: false; errors: string[] },
): T {
  if (result.ok) {
    return result.value
  }

  throw apiError(400, 'validation_failed', result.errors.join('; '), {
    body: result.errors,
  })
}

export async function requireUser(c: {
  get(name: 'user'): AppEnv['Variables']['user'] | undefined
}): Promise<AppEnv['Variables']['user']> {
  const user = c.get('user')

  if (!user) {
    throw apiError(401, 'authentication_required', 'Authentication required')
  }

  return user
}
