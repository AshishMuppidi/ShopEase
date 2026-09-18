import { useState, useEffect } from 'react'
import { adminApi } from '../../api/admin'
import { Button, LoadingSpinner, ErrorMessage, StarRating } from '../../components/ui'
import AdminNav from '../../components/admin/AdminNav'
import Pagination from '../../components/Pagination'
import { getErrorMessage } from '../../lib/errors'

export default function AdminReviews() {
  const [data, setData] = useState({ content: [], totalPages: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(0)
  
  const [deletingId, setDeletingId] = useState(null)
  const [deleteError, setDeleteError] = useState(null)

  useEffect(() => {
    load()
  }, [page])

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await adminApi.listReviews({ page, size: 20 })
      setData(res || { content: [], totalPages: 0 })
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return
    setDeletingId(id)
    setDeleteError(null)
    try {
      await adminApi.deleteReview(id)
      await load()
    } catch (err) {
      setDeleteError(getErrorMessage(err))
    } finally {
      setDeletingId(null)
    }
  }

  if (loading && data.content.length === 0) return <LoadingSpinner fullPage size="lg" />

  return (
    <div className="py-6">
      <AdminNav activeKey="reviews" />

      <h2 className="mb-4 text-xl font-bold text-slate-900">Reviews</h2>

      {deleteError && <ErrorMessage message={deleteError} className="mb-4" />}

      {error ? (
        <ErrorMessage error={error} onRetry={load} />
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">ID</th>
                  <th className="px-4 py-3 font-medium">Product ID</th>
                  <th className="px-4 py-3 font-medium">User Name</th>
                  <th className="px-4 py-3 font-medium">Rating</th>
                  <th className="px-4 py-3 font-medium">Title</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {data.content.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{r.id}</td>
                    <td className="px-4 py-3">{r.productId}</td>
                    <td className="px-4 py-3">{r.userName || 'Unknown'}</td>
                    <td className="px-4 py-3">
                      <StarRating rating={r.rating} size="sm" />
                    </td>
                    <td className="px-4 py-3">{r.title || '-'}</td>
                    <td className="px-4 py-3 text-slate-500">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleDelete(r.id)}
                        loading={deletingId === r.id}
                        disabled={deletingId && deletingId !== r.id}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
                {data.content.length === 0 && (
                  <tr>
                    <td colSpan="7" className="px-4 py-8 text-center text-slate-500">
                      No reviews found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {data.totalPages > 1 && (
            <div className="mt-6 flex justify-center">
              <Pagination
                currentPage={page}
                totalPages={data.totalPages}
                onPageChange={setPage}
              />
            </div>
          )}
        </>
      )}
    </div>
  )
}
