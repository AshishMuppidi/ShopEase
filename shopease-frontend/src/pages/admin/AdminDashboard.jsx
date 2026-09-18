import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { adminApi } from '../../api/admin'
import { formatPrice, formatDateTime } from '../../lib/format'
import { Card, LoadingSpinner, ErrorMessage, Button } from '../../components/ui'
import AdminNav from '../../components/admin/AdminNav'
import StatusBadge from '../../components/StatusBadge'

export default function AdminDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    load()
  }, [])

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await adminApi.getDashboard()
      setData(res)
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <LoadingSpinner fullPage size="lg" />

  if (error) {
    return (
      <div className="py-6">
        <AdminNav activeKey="dashboard" />
        <ErrorMessage error={error} onRetry={load} />
      </div>
    )
  }

  return (
    <div className="py-6">
      <AdminNav activeKey="dashboard" />

      {/* Header & Quick Links */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Dashboard Overview</h2>
          <p className="text-xs text-slate-500">Live operational data from the store database.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/admin/products">
            <Button size="sm" variant="outline">+ Products</Button>
          </Link>
          <Link to="/admin/categories">
            <Button size="sm" variant="outline">+ Categories</Button>
          </Link>
          <Link to="/admin/orders">
            <Button size="sm">View Orders</Button>
          </Link>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6 mb-8">
        <Card className="flex flex-col justify-between">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Users</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{data?.totalUsers || 0}</p>
        </Card>
        <Card className="flex flex-col justify-between">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Active Products</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{data?.totalProducts || 0}</p>
        </Card>
        <Card className="flex flex-col justify-between">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Orders</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{data?.totalOrders || 0}</p>
        </Card>
        <Card className="flex flex-col justify-between">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Revenue</p>
          <p className="mt-2 text-2xl font-bold text-emerald-700">{formatPrice(data?.totalRevenue || 0)}</p>
        </Card>
        <Card className="flex flex-col justify-between">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Pending Orders</p>
          <p className="mt-2 text-2xl font-bold text-amber-600">{data?.pendingOrders || 0}</p>
        </Card>
        <Card className="flex flex-col justify-between">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Low Stock (&lt; 5)</p>
          <p className="mt-2 text-2xl font-bold text-rose-600">{data?.lowStockVariants || 0}</p>
        </Card>
      </div>

      {/* Recent Orders Table */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">Recent Orders</h3>
        <Link to="/admin/orders" className="text-sm font-medium text-brand-600 hover:text-brand-700">
          View all orders →
        </Link>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Order ID</th>
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Total</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {data?.recentOrders?.map((order) => {
              const orderId = order.orderId ?? order.id
              const total = order.total ?? order.totalAmount ?? 0
              return (
                <tr key={orderId} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">#{orderId}</td>
                  <td className="px-4 py-3">{order.customerName || 'Customer'}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="px-4 py-3 font-medium">{formatPrice(total)}</td>
                  <td className="px-4 py-3 text-slate-500">
                    {order.createdAt ? formatDateTime(order.createdAt) : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      to={`/admin/orders/${orderId}`}
                      className="font-medium text-brand-600 hover:text-brand-700 text-xs"
                    >
                      Manage →
                    </Link>
                  </td>
                </tr>
              )
            })}
            {(!data?.recentOrders || data.recentOrders.length === 0) && (
              <tr>
                <td colSpan="6" className="px-4 py-8 text-center text-slate-500">
                  No recent orders found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
