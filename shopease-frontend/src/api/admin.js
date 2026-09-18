import axiosClient from './axiosClient'

/**
 * Admin endpoints — all under /api/admin/** and require ROLE_ADMIN.
 * Grouped by resource. Note variants are create + delete only (no update),
 * and order status update takes the status as a QUERY PARAM enum.
 */
export const adminApi = {
  // --- Categories ---
  createCategory: async ({ name, description }) =>
    (await axiosClient.post('/admin/categories', { name, description })).data,

  updateCategory: async (id, { name, description }) =>
    (await axiosClient.put(`/admin/categories/${id}`, { name, description })).data,

  deleteCategory: async (id) =>
    (await axiosClient.delete(`/admin/categories/${id}`)).data,

  // --- Products ---
  createProduct: async (payload) =>
    (await axiosClient.post('/admin/products', payload)).data,

  updateProduct: async (id, payload) =>
    (await axiosClient.put(`/admin/products/${id}`, payload)).data,

  deleteProduct: async (id) =>
    (await axiosClient.delete(`/admin/products/${id}`)).data,

  // --- Variants (create + delete only) ---
  createVariant: async (payload) =>
    (await axiosClient.post('/admin/variants', payload)).data,

  deleteVariant: async (id) =>
    (await axiosClient.delete(`/admin/variants/${id}`)).data,

  // --- Orders ---
  listOrders: async ({ page = 0, size = 10 } = {}) =>
    (await axiosClient.get('/admin/orders', { params: { page, size } })).data,

  getOrder: async (id) => (await axiosClient.get(`/admin/orders/${id}`)).data,

  // status is an enum sent as a query param, not a request body.
  updateOrderStatus: async (id, status) =>
    (
      await axiosClient.put(`/admin/orders/${id}/status`, null, {
        params: { status },
      })
    ).data,

  // Variant update
  updateVariant: async (id, payload) =>
    (await axiosClient.put(`/admin/variants/${id}`, payload)).data,

  // Dashboard
  getDashboard: async () =>
    (await axiosClient.get('/admin/dashboard')).data,

  // Users
  listUsers: async ({ page = 0, size = 20 } = {}) =>
    (await axiosClient.get('/admin/users', { params: { page, size } })).data,

  // Reviews (admin)
  listReviews: async (params = {}) =>
    (await axiosClient.get('/admin/reviews', { params })).data,

  deleteReview: async (id) =>
    (await axiosClient.delete(`/admin/reviews/${id}`)).data,

  // Payments (admin)
  listPayments: async (params = {}) =>
    (await axiosClient.get('/admin/payments', { params })).data,
}
