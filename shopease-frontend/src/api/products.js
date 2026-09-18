import axiosClient from './axiosClient'

/**
 * Product & variant endpoints.
 * Products are paged (Spring Page). Price lives on VARIANTS, not products.
 * Note: `keyword` and `categoryId` do NOT combine server-side (keyword wins),
 * and `sortBy` is a single ascending field name only.
 */
export const productsApi = {
  list: async ({ page = 0, size = 12, sortBy = 'id', sortDirection, categoryId, keyword, minPrice, maxPrice, minRating } = {}) => {
    const params = { page, size, sortBy }
    if (sortDirection) params.sortDirection = sortDirection
    // Only send the filters when actually set, so we don't force empty strings.
    if (categoryId !== undefined && categoryId !== null && categoryId !== '') {
      params.categoryId = categoryId
    }
    if (keyword) params.keyword = keyword
    if (minPrice !== undefined) params.minPrice = minPrice
    if (maxPrice !== undefined) params.maxPrice = maxPrice
    if (minRating !== undefined) params.minRating = minRating
    return (await axiosClient.get('/products', { params })).data
  },

  get: async (id) => (await axiosClient.get(`/products/${id}`)).data,

  // Variants for a product (array). Price/inventory live here.
  variants: async (productId) =>
    (await axiosClient.get(`/products/${productId}/variants`)).data,

  // Single variant by its own id.
  variant: async (id) => (await axiosClient.get(`/variants/${id}`)).data,
}
