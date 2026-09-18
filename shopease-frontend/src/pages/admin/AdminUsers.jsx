import { useState, useEffect } from 'react'
import { adminApi } from '../../api/admin'
import { LoadingSpinner, ErrorMessage, Badge } from '../../components/ui'
import AdminNav from '../../components/admin/AdminNav'
import Pagination from '../../components/Pagination'

export default function AdminUsers() {
  const [data, setData] = useState({ content: [], totalPages: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(0)

  useEffect(() => {
    load()
  }, [page])

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await adminApi.listUsers({ page, size: 20 })
      setData(res || { content: [], totalPages: 0 })
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading && data.content.length === 0) return <LoadingSpinner fullPage size="lg" />

  return (
    <div className="py-6">
      <AdminNav activeKey="users" />

      <h2 className="mb-4 text-xl font-bold text-slate-900">Users</h2>

      {error ? (
        <ErrorMessage error={error} onRetry={load} />
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">ID</th>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Phone</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {data.content.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{u.id}</td>
                    <td className="px-4 py-3">{u.name}</td>
                    <td className="px-4 py-3">{u.email}</td>
                    <td className="px-4 py-3">{u.phone || '-'}</td>
                    <td className="px-4 py-3">
                      <Badge tone={u.role === 'ROLE_ADMIN' ? 'warning' : 'info'}>
                        {u.role === 'ROLE_ADMIN' ? 'ADMIN' : 'CUSTOMER'}
                      </Badge>
                    </td>
                  </tr>
                ))}
                {data.content.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-4 py-8 text-center text-slate-500">
                      No users found
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
