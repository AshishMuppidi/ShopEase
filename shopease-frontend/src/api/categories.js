import axiosClient from './axiosClient'

/**
 * Category endpoints. Public list/get; admin mutations live in admin.js.
 * GET /api/categories returns an array (not paged).
 */
export const categoriesApi = {
  list: async () => (await axiosClient.get('/categories')).data,

  get: async (id) => (await axiosClient.get(`/categories/${id}`)).data,
}
