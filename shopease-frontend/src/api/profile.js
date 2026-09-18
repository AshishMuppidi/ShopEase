import api from './axiosClient'

export const profileApi = {
  get: () => api.get('/profile').then(r => r.data),
  update: (data) => api.put('/profile', data).then(r => r.data),
  getAddresses: () => api.get('/profile/addresses').then(r => r.data),
  addAddress: (data) => api.post('/profile/addresses', data).then(r => r.data),
  updateAddress: (id, data) => api.put(`/profile/addresses/${id}`, data).then(r => r.data),
  deleteAddress: (id) => api.delete(`/profile/addresses/${id}`),
  setDefault: (id) => api.put(`/profile/addresses/${id}/default`).then(r => r.data),
}
