import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { adminApi } from '../../api/admin'
import { formatPrice, formatDateTime, humanizeStatus } from '../../lib/format'
import { getErrorMessage, statusOf } from '../../lib/errors'
import { nextStatuses } from '../../lib/constants'
import { Button, Select, Card, LoadingSpinner, ErrorMessage } from '../../components/ui'
import AdminNav from '../../components/admin/AdminNav'
import StatusBadge from '../../components/StatusBadge'
import OrderItemsList from '../../components/order/OrderItemsList'
import AddressBlock from '../../components/order/AddressBlock'

export default function AdminOrderDetails() {
  const { id } = useParams()

  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [nextStatus, setNextStatus] = useState('')
  const [updating, setUpdating] = useState(false)
  const [actionError, setActionError] = useState(null)
  const [notice, setNotice] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setOrder(await adminApi.getOrder(id))
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  const transitions = useMemo(
    () => (order ? nextStatuses(order.status) : []),
    [order],
  )

  // Reset the pending choice whenever the order's status changes.
  useEffect(() => {
    setNextStatus('')
  }, [order?.status])

  const applyStatus = async () => {
    if (!nextStatus) return
    setUpdating(true)
    setActionError(null)
    setNotice(null)
    try {
      const updated = await adminApi.updateOrderStatus(order.id, nextStatus)
      setOrder(updated)
      setNotice(`Status updated to ${humanizeStatus(updated.status)}.`)
    } catch (err) {
      setActionError(getErrorMessage(err))
    } finally {
      setUpdating(false)
    }
  }

  if (loading) return <LoadingSpinner fullPage size="lg" />

  if (error) {
    const notFound = statusOf(error) === 404
    return (
      <div className="py-6">
        <AdminNav activeKey="orders" />
        {notFound ? (
          <div className="mx-auto max-w-md py-6 text-center">
            <h2 className="text-xl font-bold text-slate-900">Order not found</h2>
            <Link
              to="/admin/orders"
              className="mt-4 inline-block font-medium text-brand-600 hover:text-brand-700"
            >
              ← Back to orders
            </Link>
          </div>
        ) : (
          <ErrorMessage error={error} onRetry={load} />
        )}
      </div>
    )
  }

  const statusOptions = [
    { value: '', label: 'Choose next status…' },
    ...transitions.map((s) => ({ value: s, label: humanizeStatus(s) })),
  ]

  return (
    <div className="py-6">
      <AdminNav activeKey="orders" />

      <nav className="mb-4 text-sm text-slate-500">
        <Link to="/admin/orders" className="hover:text-slate-700">
          Orders
        </Link>
        <span className="mx-2 text-slate-300">/</span>
        <span className="text-slate-700">Order #{order.id}</span>
      </nav>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Order #{order.id}</h2>
          <p className="mt-1 text-sm text-slate-500">
            Customer #{order.userId} · Placed {formatDateTime(order.createdAt)}
          </p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <h3 className="text-sm font-semibold text-slate-800">Items</h3>
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
              <h3 className="mb-2 text-sm font-semibold text-slate-800">Shipping address</h3>
              <AddressBlock address={order.shippingAddress} />
            </Card>
            <Card>
              <h3 className="mb-2 text-sm font-semibold text-slate-800">Timeline</h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-slate-500">Placed</dt>
                  <dd className="text-slate-700">{formatDateTime(order.createdAt)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Last updated</dt>
                  <dd className="text-slate-700">{formatDateTime(order.updatedAt)}</dd>
                </div>
              </dl>
            </Card>
          </div>
        </div>

        {/* Status management */}
        <div className="lg:col-span-1">
          <Card className="sticky top-20">
            <h3 className="text-sm font-semibold text-slate-800">Update status</h3>
            {notice && (
              <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                {notice}
              </div>
            )}
            {actionError && <ErrorMessage message={actionError} className="mt-3" />}

            {transitions.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">
                This order is <span className="font-medium">{humanizeStatus(order.status)}</span>{' '}
                and has no further status changes available.
              </p>
            ) : (
              <div className="mt-3 space-y-3">
                <Select
                  value={nextStatus}
                  onChange={(e) => setNextStatus(e.target.value)}
                  options={statusOptions}
                />
                <Button
                  fullWidth
                  onClick={applyStatus}
                  loading={updating}
                  disabled={!nextStatus}
                >
                  Update status
                </Button>
                <p className="text-xs text-slate-400">
                  Only transitions allowed by the backend are shown.
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
