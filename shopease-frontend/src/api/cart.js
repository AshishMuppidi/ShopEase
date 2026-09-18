import axiosClient from './axiosClient'

/**
 * Cart endpoints — /api/cart. Requires auth.
 * Line items are addressed by variantId (NOT a separate cart-item id).
 * Update quantity is sent as a query param, not a body.
 */
export const cartApi = {
  get: async () => (await axiosClient.get('/cart')).data,

  addItem: async (variantId, quantity = 1) =>
    (await axiosClient.post('/cart/items', { variantId, quantity })).data,

  updateItem: async (variantId, quantity) =>
    (
      await axiosClient.put(`/cart/items/${variantId}`, null, {
        params: { quantity },
      })
    ).data,

  removeItem: async (variantId) =>
    (await axiosClient.delete(`/cart/items/${variantId}`)).data,

  clear: async () => (await axiosClient.delete('/cart')).data,
}
