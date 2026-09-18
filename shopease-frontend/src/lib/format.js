/**
 * Display formatting helpers. The frontend NEVER computes authoritative
 * prices/totals — it only formats values the backend already returned.
 */

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
})

// Format a numeric/string amount as USD. Falls back gracefully on bad input.
export function formatPrice(value) {
  const n = typeof value === 'string' ? Number(value) : value
  if (n === null || n === undefined || Number.isNaN(n)) return '—'
  return currencyFormatter.format(n)
}

// e.g. "Aug 25, 2026, 3:42 PM"
export function formatDateTime(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

// e.g. "Aug 25, 2026"
export function formatDate(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

// Turn an ORDER_STATUS enum into a friendly label ("IN_TRANSIT" -> "In transit").
export function humanizeStatus(status) {
  if (!status) return ''
  return status
    .toLowerCase()
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}
