import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ordersApi } from '../api/orders'
import { formatPrice, formatDateTime } from '../lib/format'
import { statusOf } from '../lib/errors'
import { Card, LoadingSpinner, ErrorMessage } from '../components/ui'
import { buttonClasses } from '../components/ui/Button'
import StatusBadge from '../components/StatusBadge'
import OrderItemsList from '../components/order/OrderItemsList'
import AddressBlock from '../components/order/AddressBlock'

export default function OrderSuccess() {
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setOrder(await ordersApi.get(id))
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  if (loading) return <LoadingSpinner fullPage size="lg" />

  if (error) {
    const notFound = statusOf(error) === 404
    return (
      <div className="py-8">
        {notFound ? (
          <div className="mx-auto max-w-md text-center">
            <h1 className="text-xl font-bold text-slate-900">Order not found</h1>
            <p className="mt-2 text-sm text-slate-500">
              We couldn’t find that order. It may belong to a different account.
            </p>
            <Link
              to="/orders"
              className="mt-5 inline-block font-medium text-brand-600 hover:text-brand-700"
            >
              ← View my orders
            </Link>
          </div>
        ) : (
          <ErrorMessage error={error} onRetry={load} />
        )}
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl py-8">
      <div className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 className="mt-5 text-2xl font-bold text-slate-900">Thank you for your order!</h1>
        <p className="mt-2 text-sm text-slate-600">
          Your payment was successful and your order is confirmed.
        </p>
      </div>

      <Card className="mt-8">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">Order number</p>
            <p className="text-lg font-bold text-slate-900">#{order.id}</p>
          </div>
          <StatusBadge status={order.status} />
        </div>

        <div className="py-2">
          <OrderItemsList items={order.items} />
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 pt-4">
          <span className="text-sm text-slate-600">Total paid</span>
          <span className="text-xl font-bold text-slate-900">
            {formatPrice(order.totalAmount)}
          </span>
        </div>

        <div className="mt-6 grid gap-6 border-t border-slate-100 pt-6 sm:grid-cols-2">
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Shipping to
            </h3>
            <AddressBlock address={order.shippingAddress} />
          </div>
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Placed on
            </h3>
            <p className="text-sm text-slate-700">{formatDateTime(order.createdAt)}</p>
          </div>
        </div>
      </Card>

      <div className="mt-6 flex justify-center gap-3">
        <Link to={`/orders/${order.id}`} className={buttonClasses({ variant: 'primary' })}>
          View order details
        </Link>
        <Link to="/products" className={buttonClasses({ variant: 'outline' })}>
          Continue shopping
        </Link>
      </div>
    </div>
  )
}
