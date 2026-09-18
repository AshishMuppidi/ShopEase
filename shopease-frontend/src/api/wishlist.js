import axiosClient from './axiosClient'

/**
 * Wishlist endpoints — /api/wishlist. Requires auth.
 * Items addressed by variantId. No quantity concept.
 */
export const wishlistApi = {
  get: async () => (await axiosClient.get('/wishlist')).data,

  addItem: async (variantId) =>
    (await axiosClient.post('/wishlist/items', { variantId })).data,

  removeItem: async (variantId) =>
    (await axiosClient.delete(`/wishlist/items/${variantId}`)).data,
}
