const ACCESS_KEY = 'shopease_access_token'
const REFRESH_KEY = 'shopease_refresh_token'

/**
 * Small wrapper around localStorage for the JWT pair.
 * The backend returns { accessToken, refreshToken, tokenType } on login/refresh,
 * and rotates the refresh token on every refresh — so we always overwrite both.
 */
export const tokenStore = {
  getAccess: () => localStorage.getItem(ACCESS_KEY),
  getRefresh: () => localStorage.getItem(REFRESH_KEY),
  set: ({ accessToken, refreshToken }) => {
    if (accessToken) localStorage.setItem(ACCESS_KEY, accessToken)
    if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken)
  },
  clear: () => {
    localStorage.removeItem(ACCESS_KEY)
    localStorage.removeItem(REFRESH_KEY)
  },
  hasSession: () => Boolean(localStorage.getItem(ACCESS_KEY)),
}
