import api from './axiosClient'

export const reviewsApi = {
  list: (productId, params) => api.get(`/products/${productId}/reviews`, { params }).then(r => r.data),
  summary: (productId) => api.get(`/products/${productId}/reviews/summary`).then(r => r.data),
  create: (productId, data) => api.post(`/products/${productId}/reviews`, data).then(r => r.data),
  delete: (reviewId) => api.delete(`/reviews/${reviewId}`).then(r => r.data),
  toggleHelpful: (reviewId) => api.post(`/reviews/${reviewId}/helpful`).then(r => r.data),
}
