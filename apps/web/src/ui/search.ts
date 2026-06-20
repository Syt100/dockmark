export function normalizedSearchQuery(value: string): string {
  return value.trim().toLowerCase()
}

export function matchesSearchQuery(
  query: string,
  values: Array<string | null | undefined>,
): boolean {
  const normalized = normalizedSearchQuery(query)

  if (!normalized) {
    return true
  }

  return values.some((value) => (value ?? '').toLowerCase().includes(normalized))
}
