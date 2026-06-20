import type {
  ApiErrorCode,
  ApiErrorResponse,
  AuthLoginRequest,
  AuthSetupRequest,
  AuthSetupStatusResponse,
  AuthSuccessResponse,
  AuthUserResponse,
  Category,
  CategoryResponse,
  CategoryInput,
  NavResponse,
  ServiceItem,
  ServiceItemInput,
  Tag,
  TagResponse,
  TagInput,
} from '@dockmark/shared'

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: ApiErrorCode,
    readonly fields?: Record<string, string[]>,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

function isApiErrorResponse(value: unknown): value is ApiErrorResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    'error' in value &&
    typeof (value as ApiErrorResponse).error === 'object' &&
    (value as ApiErrorResponse).error !== null &&
    typeof (value as ApiErrorResponse).error.code === 'string' &&
    typeof (value as ApiErrorResponse).error.message === 'string'
  )
}

async function readError(response: Response): Promise<ApiError> {
  const message = await response.text()
  const contentType = response.headers.get('content-type') ?? ''

  if (contentType.includes('application/json')) {
    try {
      const body: unknown = JSON.parse(message)

      if (isApiErrorResponse(body)) {
        return new ApiError(body.error.message, response.status, body.error.code, body.error.fields)
      }
    } catch {
      // Fall through to text fallback below.
    }
  }

  return new ApiError(message || `Request failed with ${response.status}`, response.status)
}

type JsonRequestInit = Omit<RequestInit, 'body'> & {
  body?: unknown
}

function jsonInit(init: JsonRequestInit = {}): RequestInit {
  const { body, headers, ...rest } = init

  return {
    ...rest,
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    headers: {
      'content-type': 'application/json',
      ...headers,
    },
  }
}

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...init?.headers,
    },
  })

  if (!response.ok) {
    throw await readError(response)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}

export function jsonRequest<T>(path: string, init?: JsonRequestInit): Promise<T> {
  return request<T>(path, jsonInit(init))
}

export async function fetchAuthSetupStatus(): Promise<AuthSetupStatusResponse> {
  return request<AuthSetupStatusResponse>('/api/auth/setup')
}

export async function setupBuiltinAuth(input: AuthSetupRequest): Promise<AuthSuccessResponse> {
  return jsonRequest<AuthSuccessResponse>('/api/auth/setup', {
    method: 'POST',
    body: input,
  })
}

export async function login(input: AuthLoginRequest): Promise<AuthSuccessResponse> {
  return jsonRequest<AuthSuccessResponse>('/api/auth/login', {
    method: 'POST',
    body: input,
  })
}

export async function logout(): Promise<void> {
  await request<void>('/api/auth/logout', { method: 'POST' })
}

export async function fetchCurrentUser(): Promise<AuthUserResponse> {
  return request<AuthUserResponse>('/api/auth/me')
}

export async function fetchNavigation(): Promise<NavResponse> {
  return request<NavResponse>('/api/nav')
}

export async function fetchCategories(): Promise<Category[]> {
  const body = await request<{ categories: Category[] }>('/api/categories')
  return body.categories
}

export async function fetchCategory(id: string): Promise<Category> {
  const body = await request<CategoryResponse>(`/api/categories/${id}`)
  return body.category
}

export async function createCategory(input: CategoryInput): Promise<Category> {
  const body = await jsonRequest<CategoryResponse>('/api/categories', {
    method: 'POST',
    body: input,
  })
  return body.category
}

export async function updateCategory(id: string, input: CategoryInput): Promise<Category> {
  const body = await jsonRequest<CategoryResponse>(`/api/categories/${id}`, {
    method: 'PATCH',
    body: input,
  })
  return body.category
}

export async function deleteCategory(id: string): Promise<void> {
  await request<void>(`/api/categories/${id}`, { method: 'DELETE' })
}

export async function fetchTags(): Promise<Tag[]> {
  const body = await request<{ tags: Tag[] }>('/api/tags')
  return body.tags
}

export async function fetchTag(id: string): Promise<Tag> {
  const body = await request<TagResponse>(`/api/tags/${id}`)
  return body.tag
}

export async function createTag(input: TagInput): Promise<Tag> {
  const body = await jsonRequest<TagResponse>('/api/tags', {
    method: 'POST',
    body: input,
  })
  return body.tag
}

export async function updateTag(id: string, input: TagInput): Promise<Tag> {
  const body = await jsonRequest<TagResponse>(`/api/tags/${id}`, {
    method: 'PATCH',
    body: input,
  })
  return body.tag
}

export async function deleteTag(id: string): Promise<void> {
  await request<void>(`/api/tags/${id}`, { method: 'DELETE' })
}

export async function fetchItems(): Promise<ServiceItem[]> {
  const body = await request<{ items: ServiceItem[] }>('/api/items')
  return body.items
}

export async function fetchItem(id: string): Promise<ServiceItem> {
  const body = await request<{ item: ServiceItem }>(`/api/items/${id}`)
  return body.item
}

export async function createItem(input: ServiceItemInput): Promise<ServiceItem> {
  const body = await jsonRequest<{ item: ServiceItem }>('/api/items', {
    method: 'POST',
    body: input,
  })
  return body.item
}

export async function updateItem(id: string, input: ServiceItemInput): Promise<ServiceItem> {
  const body = await jsonRequest<{ item: ServiceItem }>(`/api/items/${id}`, {
    method: 'PATCH',
    body: input,
  })
  return body.item
}

export async function deleteItem(id: string): Promise<void> {
  await request<void>(`/api/items/${id}`, { method: 'DELETE' })
}
