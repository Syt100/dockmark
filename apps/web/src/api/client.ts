import type {
  Category,
  CategoryInput,
  NavResponse,
  ServiceItem,
  ServiceItemInput,
  Tag,
  TagInput,
} from '@dockmark/shared'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...init?.headers,
    },
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || `Request failed with ${response.status}`)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}

export async function fetchNavigation(): Promise<NavResponse> {
  return request<NavResponse>('/api/nav')
}

export async function fetchCategories(): Promise<Category[]> {
  const body = await request<{ categories: Category[] }>('/api/categories')
  return body.categories
}

export async function createCategory(input: CategoryInput): Promise<Category> {
  const body = await request<{ category: Category }>('/api/categories', {
    method: 'POST',
    body: JSON.stringify(input),
  })
  return body.category
}

export async function updateCategory(id: string, input: CategoryInput): Promise<Category> {
  const body = await request<{ category: Category }>(`/api/categories/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
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

export async function createTag(input: TagInput): Promise<Tag> {
  const body = await request<{ tag: Tag }>('/api/tags', {
    method: 'POST',
    body: JSON.stringify(input),
  })
  return body.tag
}

export async function updateTag(id: string, input: TagInput): Promise<Tag> {
  const body = await request<{ tag: Tag }>(`/api/tags/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
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
  const body = await request<{ item: ServiceItem }>('/api/items', {
    method: 'POST',
    body: JSON.stringify(input),
  })
  return body.item
}

export async function updateItem(id: string, input: ServiceItemInput): Promise<ServiceItem> {
  const body = await request<{ item: ServiceItem }>(`/api/items/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
  return body.item
}

export async function deleteItem(id: string): Promise<void> {
  await request<void>(`/api/items/${id}`, { method: 'DELETE' })
}
