import { useCallback, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ordersApi } from '../api/orders'
import { normalizePage } from '../lib/page'
import { formatPrice, formatDateTime } from '../lib/format'
import { Card, LoadingSpinner, EmptyState, ErrorMessage } from '../components/ui'
import { buttonClasses } from '../components/ui/Button'
import StatusBadge from '../components/StatusBadge'
import Pagination from '../components/Pagination'

const PAGE_SIZE = 10

function BoxIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...props}>
      <path d="M21 8 12 3 3 8v8l9 5 9-5z" strokeLinejoin="round" />
      <path d="M3 8l9 5 9-5M12 13v8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function Orders({ inline = false }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Number(searchParams.get('page') || 0)

  const [pageData, setPageData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await ordersApi.list({ page, size: PAGE_SIZE })
      setPageData(normalizePage(data))
    } catch (err) {
      setError(err)
      setPageData(null)
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    load()
  }, [load])

  const goToPage = (p) => {
    const next = new URLSearchParams(searchParams)
    if (p <= 0) next.delete('page')
    else next.set('page', String(p))
    setSearchParams(next)
  }

  if (loading) return <LoadingSpinner fullPage={!inline} size="lg" />

  if (error) {
    return (
      <div className="py-6">
        {!inline && <h1 className="mb-4 text-2xl font-bold text-slate-900">Your orders</h1>}
        <ErrorMessage error={error} onRetry={load} />
      </div>
    )
  }

  const orders = pageData?.content ?? []

  if (orders.length === 0) {
    return (
      <div className={inline ? "" : "py-6"}>
        {!inline && <h1 className="mb-6 text-2xl font-bold text-slate-900">Your orders</h1>}
        <EmptyState
          icon={<BoxIcon className="h-6 w-6" />}
          title="No orders yet"
          message="When you place an order, it will show up here so you can track it."
          action={
            <Link to="/products" className={buttonClasses({ variant: 'primary' })}>
              Start shopping
            </Link>
          }
        />
      </div>
    )
  }

  return (
    <div className={inline ? "" : "py-6"}>
      {!inline && <h1 className="mb-6 text-2xl font-bold text-slate-900">Your orders</h1>}

      <div className="space-y-3">
        {orders.map((order) => {
          const itemCount = Array.isArray(order.items) ? order.items.length : 0
          return (
            <Link key={order.id} to={`/orders/${order.id}`} className="block">
              <Card className="transition-colors hover:border-brand-300">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-slate-900">Order #{order.id}</span>
                      <StatusBadge status={order.status} />
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {formatDateTime(order.createdAt)} · {itemCount}{' '}
                      {itemCount === 1 ? 'item' : 'items'}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-lg font-bold text-slate-900">
                      {formatPrice(order.totalAmount)}
                    </span>
                    <span className="text-sm font-medium text-brand-600">Details →</span>
                  </div>
                </div>
              </Card>
            </Link>
          )
        })}
      </div>

      <div className="mt-8">
        <Pagination
          page={pageData.number}
          totalPages={pageData.totalPages}
          onChange={goToPage}
        />
      </div>
    </div>
  )
}
