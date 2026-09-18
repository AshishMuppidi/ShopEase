import api from './axiosClient'

export const recommendationsApi = {
  related: (productId) => api.get(`/products/${productId}/related`).then(r => r.data),
  deals: (params) => api.get('/products/deals', { params }).then(r => r.data),
}
