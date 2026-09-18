/**
 * Order status constants mirrored from the backend OrderStatus enum and its
 * canTransitionTo() rules. Keep these in sync with:
 *   com.ashish.ecommerce.order.entity.OrderStatus
 */

export const ORDER_STATUSES = [
  'PENDING',
  'CONFIRMED',
  'PROCESSING',
  'PACKED',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
  'FAILED',
]

// Statuses from which the customer may cancel (backend: canBeCancelled()).
export const CANCELLABLE_STATUSES = ['PENDING', 'CONFIRMED', 'PROCESSING']

export const TERMINAL_STATUSES = ['DELIVERED', 'CANCELLED', 'FAILED']

// Allowed forward transitions (backend: canTransitionTo()). Used to build the
// admin status dropdown so we never offer an illegal transition.
export const ORDER_TRANSITIONS = {
  PENDING: ['CONFIRMED', 'PROCESSING', 'CANCELLED', 'FAILED'],
  CONFIRMED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['PACKED', 'CANCELLED'],
  PACKED: ['SHIPPED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
  FAILED: [],
}

// Tailwind badge classes per status (foreground + subtle background).
export const STATUS_STYLES = {
  PENDING: 'bg-amber-100 text-amber-800',
  CONFIRMED: 'bg-sky-100 text-sky-800',
  PROCESSING: 'bg-indigo-100 text-indigo-800',
  PACKED: 'bg-violet-100 text-violet-800',
  SHIPPED: 'bg-blue-100 text-blue-800',
  DELIVERED: 'bg-emerald-100 text-emerald-800',
  CANCELLED: 'bg-slate-200 text-slate-700',
  FAILED: 'bg-rose-100 text-rose-800',
}

export function canCancel(status) {
  return CANCELLABLE_STATUSES.includes(status)
}

export function nextStatuses(status) {
  return ORDER_TRANSITIONS[status] || []
}
