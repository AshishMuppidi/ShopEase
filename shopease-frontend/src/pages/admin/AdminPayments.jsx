import { useCallback, useEffect, useState } from 'react'
import { adminApi } from '../../api/admin'
import { formatDateTime, formatPrice } from '../../lib/format'
import { Card, LoadingSpinner, ErrorMessage } from '../../components/ui'
import Pagination from '../../components/Pagination'

export default function AdminPayments() {
  const [payments, setPayments] = useState([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await adminApi.listPayments({ page, size: 20 })
      setPayments(data?.content || [])
      setTotalPages(data?.totalPages || 0)
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    load()
  }, [load])

  if (loading && payments.length === 0) return <LoadingSpinner fullPage size="lg" />

  if (error && payments.length === 0) {
    return (
      <div className="py-6">
        <h1 className="mb-4 text-2xl font-bold text-slate-900">Payments</h1>
        <ErrorMessage error={error} onRetry={load} />
      </div>
    )
  }

  return (
    <div className="py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Payments</h1>
      </div>

      <Card padded={false}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Payment ID</th>
                <th className="px-4 py-3 font-medium">Order ID</th>
                <th className="px-4 py-3 font-medium">Method</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    No payments found.
                  </td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{p.id}</td>
                    <td className="px-4 py-3">{p.orderId}</td>
                    <td className="px-4 py-3">{p.paymentMethod || 'Simulated'}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          p.status === 'SUCCESS' || p.status === 'COMPLETED'
                            ? 'bg-green-100 text-green-800'
                            : p.status === 'FAILED'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium">{formatPrice(p.amount)}</td>
                    <td className="px-4 py-3">{formatDateTime(p.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {totalPages > 1 && (
        <div className="mt-6 flex justify-center">
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </div>
      )}
    </div>
  )
}
