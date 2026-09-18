import axios from 'axios'
import { tokenStore } from './tokenStore'

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'

// Main client — all app requests go through this instance.
const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Bare client used ONLY for the token refresh call, so a failed refresh
// can never recurse back through the response interceptor (no 401 loop).
const refreshClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// The app (AuthContext) registers a handler so a hard auth failure can clear
// state and redirect to /login without this module importing React/Router.
let onAuthFailure = null
export function setAuthFailureHandler(fn) {
  onAuthFailure = fn
}

// Attach the bearer token to every outgoing request.
axiosClient.interceptors.request.use((config) => {
  const token = tokenStore.getAccess()
  if (token) {
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// --- single-flight refresh with request queueing ---------------------------
let isRefreshing = false
let pendingQueue = []

function flushQueue(error, token) {
  pendingQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error)
    else resolve(token)
  })
  pendingQueue = []
}

function forceLogout() {
  tokenStore.clear()
  if (typeof onAuthFailure === 'function') onAuthFailure()
}

axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    const status = error.response?.status
    const url = original?.url || ''

    // Never try to refresh for the auth endpoints themselves.
    const isAuthEndpoint =
      url.includes('/auth/login') ||
      url.includes('/auth/register') ||
      url.includes('/auth/refresh')

    // Only a 401, only once per request, and not for auth endpoints.
    if (status !== 401 || original?._retry || isAuthEndpoint) {
      return Promise.reject(error)
    }

    const refreshToken = tokenStore.getRefresh()
    if (!refreshToken) {
      forceLogout()
      return Promise.reject(error)
    }

    // If a refresh is already in flight, queue this request until it resolves.
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push({ resolve, reject })
      }).then((token) => {
        original._retry = true
        original.headers = original.headers || {}
        original.headers.Authorization = `Bearer ${token}`
        return axiosClient(original)
      })
    }

    original._retry = true
    isRefreshing = true
    try {
      const { data } = await refreshClient.post('/auth/refresh', { refreshToken })
      // Rotation: persist BOTH the new access and new refresh token.
      tokenStore.set({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      })
      flushQueue(null, data.accessToken)
      original.headers = original.headers || {}
      original.headers.Authorization = `Bearer ${data.accessToken}`
      return axiosClient(original)
    } catch (refreshError) {
      flushQueue(refreshError, null)
      forceLogout()
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  },
)

export default axiosClient
