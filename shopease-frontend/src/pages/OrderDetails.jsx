import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ordersApi } from '../api/orders'
import { formatPrice, formatDateTime } from '../lib/format'
import { getErrorMessage, statusOf } from '../lib/errors'
import { canCancel } from '../lib/constants'
import { Button, Card, LoadingSpinner, ErrorMessage } from '../components/ui'
import StatusBadge from '../components/StatusBadge'
import OrderItemsList from '../components/order/OrderItemsList'
import AddressBlock from '../components/order/AddressBlock'

export default function OrderDetails() {
  const { id } = useParams()

  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [confirming, setConfirming] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [actionError, setActionError] = useState(null)
  const [notice, setNotice] = useState(null)

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

  const cancelOrder = async () => {
    setCancelling(true)
    setActionError(null)
    try {
      // Backend returns the updated order (CANCELLED) and restores inventory.
      const updated = await ordersApi.cancel(order.id)
      setOrder(updated)
      setConfirming(false)
      setNotice('Your order has been cancelled and any reserved stock was released.')
    } catch (err) {
      setActionError(getErrorMessage(err))
    } finally {
      setCancelling(false)
    }
  }

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
              ← Back to my orders
            </Link>
          </div>
        ) : (
          <ErrorMessage error={error} onRetry={load} />
        )}
      </div>
    )
  }

  const cancellable = canCancel(order.status)

  return (
    <div className="mx-auto max-w-2xl py-6">
      <nav className="mb-5 text-sm text-slate-500">
        <Link to="/orders" className="hover:text-slate-700">
          My orders
        </Link>
        <span className="mx-2 text-slate-300">/</span>
        <span className="text-slate-700">Order #{order.id}</span>
      </nav>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Order #{order.id}</h1>
          <p className="mt-1 text-sm text-slate-500">
            Placed {formatDateTime(order.createdAt)}
          </p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {notice && (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-800">
          {notice}
        </div>
      )}

      <Card>
        <h2 className="text-sm font-semibold text-slate-800">Items</h2>
        <div className="mt-2">
          <OrderItemsList items={order.items} />
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
          <span className="text-sm text-slate-600">Total</span>
          <span className="text-xl font-bold text-slate-900">
            {formatPrice(order.totalAmount)}
          </span>
        </div>
      </Card>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Card>
          <h2 className="mb-2 text-sm font-semibold text-slate-800">Shipping address</h2>
          <AddressBlock address={order.shippingAddress} />
        </Card>
        <Card className="sm:col-span-2">
          <h2 className="mb-4 text-sm font-semibold text-slate-800">Order Status Timeline</h2>
          <div className="relative pt-2 pb-6">
            {['FAILED', 'CANCELLED'].includes(order.status) ? (
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-500 text-white font-bold">!</span>
                <div>
                  <div className="font-bold text-rose-600">{order.status === 'FAILED' ? 'Payment Failed' : 'Order Cancelled'}</div>
                  <div className="text-xs text-slate-500">Updated: {formatDateTime(order.updatedAt)}</div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row justify-between relative">
                <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-slate-200 sm:w-full sm:h-0.5 sm:left-4 sm:right-4 sm:top-4 sm:bottom-auto"></div>
                {['PENDING', 'CONFIRMED', 'PROCESSING', 'PACKED', 'SHIPPED', 'DELIVERED'].map((step, i) => {
                  const statuses = ['PENDING', 'CONFIRMED', 'PROCESSING', 'PACKED', 'SHIPPED', 'DELIVERED']
                  const currentIndex = statuses.indexOf(order.status)
                  const isActive = currentIndex >= i
                  const isCurrent = currentIndex === i
                  return (
                    <div key={step} className="relative flex sm:flex-col items-center gap-4 sm:gap-2 z-10 mb-6 sm:mb-0">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${isActive ? 'bg-brand-600 border-brand-600 text-white' : 'bg-white border-slate-300 text-slate-300'}`}>
                        {isActive ? '✓' : i + 1}
                      </div>
                      <div className="sm:text-center">
                        <div className={`text-sm font-semibold ${isActive ? 'text-slate-900' : 'text-slate-400'}`}>{step}</div>
                        {isCurrent && <div className="text-xs text-brand-600 font-medium hidden sm:block">Current Stage</div>}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
          <div className="mt-2 text-xs text-slate-500 text-right border-t border-slate-100 pt-3">
            Order placed: {formatDateTime(order.createdAt)} • Last updated: {formatDateTime(order.updatedAt)}
          </div>
        </Card>
      </div>

      {/* Cancellation */}
      <Card className="mt-4">
        {actionError && <ErrorMessage message={actionError} className="mb-3" />}
        {cancellable ? (
          confirming ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-slate-700">
                Cancel this order? Reserved stock will be released.
              </p>
              <div className="flex gap-2">
                <Button variant="danger" onClick={cancelOrder} loading={cancelling}>
                  Yes, cancel
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setConfirming(false)}
                  disabled={cancelling}
                >
                  Keep order
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-slate-800">Need to make a change?</h2>
                <p className="text-xs text-slate-500">
                  You can cancel while the order is still {order.status.toLowerCase()}.
                </p>
              </div>
              <Button variant="outline" onClick={() => setConfirming(true)}>
                Cancel order
              </Button>
            </div>
          )
        ) : (
          <p className="text-sm text-slate-500">
            This order can no longer be cancelled.
          </p>
        )}
      </Card>
    </div>
  )
}
