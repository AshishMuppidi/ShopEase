/**
 * Normalize a Spring `Page` response into a stable shape, regardless of
 * whether it serialized "classic-flat" (totalElements/number at top level)
 * or the newer nested form ({ content, page: { number, size, totalElements,
 * totalPages } }). We could not confirm which the backend emits (no live DB
 * here), so we defend against both.
 *
 * Returns: { content, number, size, totalElements, totalPages, first, last, empty }
 * `number` is the zero-based current page index.
 */
export function normalizePage(data) {
  if (!data || typeof data !== 'object') {
    return emptyPage()
  }

  const content = Array.isArray(data.content)
    ? data.content
    : Array.isArray(data)
      ? data
      : []

  // Nested metadata (Spring Data 4.x / PagedModel) takes priority if present.
  const meta = data.page && typeof data.page === 'object' ? data.page : data

  const number = numberOr(meta.number, 0)
  const size = numberOr(meta.size, content.length)
  const totalElements = numberOr(meta.totalElements, content.length)
  const totalPages = numberOr(
    meta.totalPages,
    size > 0 ? Math.ceil(totalElements / size) : 1,
  )

  return {
    content,
    number,
    size,
    totalElements,
    totalPages,
    first: typeof data.first === 'boolean' ? data.first : number <= 0,
    last: typeof data.last === 'boolean' ? data.last : number >= totalPages - 1,
    empty: content.length === 0,
  }
}

function numberOr(value, fallback) {
  const n = typeof value === 'string' ? Number(value) : value
  return typeof n === 'number' && !Number.isNaN(n) ? n : fallback
}

function emptyPage() {
  return {
    content: [],
    number: 0,
    size: 0,
    totalElements: 0,
    totalPages: 0,
    first: true,
    last: true,
    empty: true,
  }
}
