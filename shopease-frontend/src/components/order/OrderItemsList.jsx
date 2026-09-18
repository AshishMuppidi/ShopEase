import { formatPrice } from '../../lib/format'

/**
 * Renders an order's line items. Values (price, subTotal) are shown exactly as
 * the backend returned them — the frontend never recomputes totals.
 */
export default function OrderItemsList({ items = [] }) {
  if (!items.length) {
    return (
      <p className="text-sm text-slate-500">This order has no line items.</p>
    )
  }

  return (
    <ul className="divide-y divide-slate-100">
      {items.map((item) => (
        <li key={item.id ?? item.variantId} className="flex items-start justify-between gap-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-slate-800">
              {item.productName}
            </p>
            <p className="text-xs text-slate-500">SKU: {item.sku}</p>
            <p className="mt-0.5 text-xs text-slate-500">
              {formatPrice(item.price)} × {item.quantity}
            </p>
          </div>
          <span className="whitespace-nowrap text-sm font-semibold text-slate-900">
            {formatPrice(item.subTotal)}
          </span>
        </li>
      ))}
    </ul>
  )
}
