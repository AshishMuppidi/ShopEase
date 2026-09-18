/**
 * Turn an axios error into a single human-readable message.
 * Backend error JSON is { timestamp, status, error, message, path };
 * validation failures may put a field->message map into `message`.
 * We never surface raw stack traces.
 */

const STATUS_FALLBACKS = {
  400: 'Something about that request was invalid. Please check your input and try again.',
  401: 'Your session has expired. Please sign in again.',
  403: "You don't have permission to do that.",
  404: 'We could not find what you were looking for.',
  409: 'That action conflicts with the current state. Please refresh and try again.',
  500: 'Something went wrong on the server. Please try again in a moment.',
}

export function getErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  // No response at all — network / CORS / server down.
  if (error?.code === 'ERR_NETWORK' || !error?.response) {
    return 'Could not reach the server. Make sure the backend is running and try again.'
  }

  const { status, data } = error.response

  // Prefer the backend's own message when it's a plain string.
  if (data) {
    if (typeof data === 'string' && data.trim()) return data
    if (typeof data.message === 'string' && data.message.trim()) return data.message
    // Validation map: { message: { field: "msg", ... } } or { errors: {...} }.
    const map = (typeof data.message === 'object' && data.message) || data.errors
    if (map && typeof map === 'object') {
      const first = Object.values(map).find((v) => typeof v === 'string')
      if (first) return first
    }
    if (typeof data.error === 'string' && data.error.trim() && !STATUS_FALLBACKS[status]) {
      return data.error
    }
  }

  return STATUS_FALLBACKS[status] || fallback
}

// Convenience booleans for callers that want to branch on category.
export function statusOf(error) {
  return error?.response?.status ?? null
}
