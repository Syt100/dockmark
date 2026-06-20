import { HTTPException } from 'hono/http-exception'
import type { ContentfulStatusCode } from 'hono/utils/http-status'
import type { ApiErrorCode, ApiErrorResponse } from '@dockmark/shared'

export class ApiHttpError extends Error {
  constructor(
    readonly status: ContentfulStatusCode,
    readonly code: ApiErrorCode,
    message: string,
    readonly fields?: Record<string, string[]>,
  ) {
    super(message)
    this.name = 'ApiHttpError'
  }
}

function messageFromResponse(response: Response): string {
  return response.statusText || 'Request failed'
}

function codeForStatus(status: number): ApiErrorCode {
  if (status === 400) return 'validation_failed'
  if (status === 401) return 'authentication_required'
  if (status === 404) return 'not_found'
  if (status === 409) return 'conflict'
  if (status === 503) return 'config_error'
  return 'internal_error'
}

function isD1UniqueConstraintError(error: unknown): error is Error {
  return error instanceof Error && error.message.includes('UNIQUE constraint failed:')
}

export function apiError(
  status: ContentfulStatusCode,
  code: ApiErrorCode,
  message: string,
  fields?: Record<string, string[]>,
): ApiHttpError {
  return new ApiHttpError(status, code, message, fields)
}

export function apiErrorResponse(error: ApiHttpError): Response {
  const body: ApiErrorResponse = {
    error: {
      code: error.code,
      message: error.message,
      ...(error.fields ? { fields: error.fields } : {}),
    },
  }

  return Response.json(body, { status: error.status })
}

export async function apiErrorResponseFromUnknown(error: unknown): Promise<Response> {
  if (error instanceof ApiHttpError) {
    return apiErrorResponse(error)
  }

  if (error instanceof HTTPException) {
    const response = error.getResponse()
    const message = error.message || messageFromResponse(response)
    return apiErrorResponse(new ApiHttpError(response.status as ContentfulStatusCode, codeForStatus(response.status), message))
  }

  if (isD1UniqueConstraintError(error)) {
    console.error(error)
    return apiErrorResponse(new ApiHttpError(409, 'conflict', 'Resource already exists'))
  }

  console.error(error)
  return apiErrorResponse(new ApiHttpError(500, 'internal_error', 'Internal Server Error'))
}
