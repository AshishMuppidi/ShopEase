import { useCallback, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { adminApi } from '../../api/admin'
import { normalizePage } from '../../lib/page'
import { formatPrice, formatDateTime } from '../../lib/format'
import { Card, LoadingSpinner, EmptyState, ErrorMessage } from '../../components/ui'
import AdminNav from '../../components/admin/AdminNav'
import StatusBadge from '../../components/StatusBadge'
import Pagination from '../../components/Pagination'

const PAGE_SIZE = 10

export default function AdminOrders() {
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Number(searchParams.get('page') || 0)

  const [pageData, setPageData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await adminApi.listOrders({ page, size: PAGE_SIZE })
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

  const orders = pageData?.content ?? []

  return (
    <div className="py-6">
      <AdminNav activeKey="orders" />

      <h2 className="mb-4 text-lg font-semibold text-slate-900">All orders</h2>

      {loading ? (
        <LoadingSpinner size="lg" />
      ) : error ? (
        <ErrorMessage error={error} onRetry={load} />
      ) : orders.length === 0 ? (
        <EmptyState title="No orders yet" message="Customer orders will appear here as they come in." />
      ) : (
        <>
          <div className="space-y-2">
            {orders.map((order) => {
              const itemCount = Array.isArray(order.items) ? order.items.length : 0
              return (
                <Link key={order.id} to={`/admin/orders/${order.id}`} className="block">
                  <Card className="transition-colors hover:border-brand-300">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-slate-900">Order #{order.id}</span>
                          <StatusBadge status={order.status} />
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                          Customer #{order.userId} · {formatDateTime(order.createdAt)} ·{' '}
                          {itemCount} {itemCount === 1 ? 'item' : 'items'}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-lg font-bold text-slate-900">
                          {formatPrice(order.totalAmount)}
                        </span>
                        <span className="text-sm font-medium text-brand-600">Manage →</span>
                      </div>
                    </div>
                  </Card>
                </Link>
              )
            })}
          </div>

          <div className="mt-8">
            <Pagination page={pageData.number} totalPages={pageData.totalPages} onChange={goToPage} />
          </div>
        </>
      )}
    </div>
  )
}
