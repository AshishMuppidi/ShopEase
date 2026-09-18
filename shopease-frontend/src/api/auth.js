import axiosClient from './axiosClient'

/**
 * Auth endpoints — /api/auth/*.
 * - login returns { accessToken, refreshToken, tokenType } (no user profile),
 *   so AuthContext follows up with `me()` to learn identity + role.
 * - register returns a UserResponse with NO tokens; AuthContext logs in right
 *   after to establish a session.
 * - Token refresh is NOT called from here: the axiosClient response
 *   interceptor owns it (via a separate bare client) to avoid 401 recursion.
 * - logout returns plain text.
 */
export const authApi = {
  register: async ({ name, email, password }) =>
    (await axiosClient.post('/auth/register', { name, email, password })).data,

  login: async ({ email, password }) =>
    (await axiosClient.post('/auth/login', { email, password })).data,

  logout: async () => (await axiosClient.post('/auth/logout')).data,

  // Current authenticated user profile.
  me: async () => (await axiosClient.get('/users/me')).data,
}
