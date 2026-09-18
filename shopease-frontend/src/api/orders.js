import axiosClient from './axiosClient'

/**
 * Order endpoints. Checkout reads the current cart server-side; the body
 * only carries the shipping address. Orders are paged (Spring Page).
 * shippingAddress = { fullName, phone, street, city, state, zipCode, country }.
 */
export const ordersApi = {
  checkout: async (body) =>
    (await axiosClient.post('/orders/checkout', body)).data,

  list: async ({ page = 0, size = 10 } = {}) =>
    (await axiosClient.get('/orders', { params: { page, size } })).data,

  get: async (id) => (await axiosClient.get(`/orders/${id}`)).data,

  cancel: async (id) => (await axiosClient.post(`/orders/${id}/cancel`)).data,
}
