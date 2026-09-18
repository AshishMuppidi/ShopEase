import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../api/auth'
import { tokenStore } from '../api/tokenStore'
import { setAuthFailureHandler } from '../api/axiosClient'

const AuthContext = createContext(null)

/**
 * Owns authentication state for the whole app.
 * - Backend `login` returns only tokens, so we call `/users/me` to learn the
 *   user's identity + role.
 * - Backend `register` returns a user but NO tokens, so we log in right after
 *   for a smooth flow.
 * - A hard auth failure (refresh failed) is pushed here by the axios
 *   interceptor via setAuthFailureHandler, so we can clear state + redirect.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [initializing, setInitializing] = useState(true)
  const navigate = useNavigate()

  // Let the axios layer force a logout when a token refresh ultimately fails.
  useEffect(() => {
    setAuthFailureHandler(() => {
      setUser(null)
      navigate('/login', { replace: true })
    })
  }, [navigate])

  // Restore the session on first load if tokens are present.
  useEffect(() => {
    let active = true
    async function bootstrap() {
      if (!tokenStore.hasSession()) {
        setInitializing(false)
        return
      }
      try {
        const me = await authApi.me()
        if (active) setUser(me)
      } catch {
        tokenStore.clear()
        if (active) setUser(null)
      } finally {
        if (active) setInitializing(false)
      }
    }
    bootstrap()
    return () => {
      active = false
    }
  }, [])

  const login = useCallback(async (email, password) => {
    const tokens = await authApi.login({ email, password })
    tokenStore.set(tokens)
    const me = await authApi.me()
    setUser(me)
    return me
  }, [])

  const register = useCallback(
    async (name, email, password) => {
      await authApi.register({ name, email, password })
      // No tokens come back from register — authenticate immediately.
      return login(email, password)
    },
    [login],
  )

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } catch {
      // Best effort — even if the call fails, we still clear locally.
    } finally {
      tokenStore.clear()
      setUser(null)
      navigate('/login', { replace: true })
    }
  }, [navigate])

  const value = {
    user,
    initializing,
    isAuthenticated: Boolean(user),
    isAdmin: user?.role === 'ADMIN',
    login,
    register,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
