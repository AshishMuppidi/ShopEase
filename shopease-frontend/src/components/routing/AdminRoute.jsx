import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import LoadingSpinner from '../ui/LoadingSpinner'

/**
 * Gate for /admin/* routes. Requires an authenticated user with the ADMIN
 * role. Unauthenticated users go to login; signed-in non-admins are sent to a
 * "not authorized" screen (never silently to the same page).
 */
export default function AdminRoute({ children }) {
  const { isAuthenticated, isAdmin, initializing } = useAuth()
  const location = useLocation()

  if (initializing) return <LoadingSpinner fullPage size="lg" />

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (!isAdmin) {
    return <Navigate to="/forbidden" replace />
  }

  return children
}
