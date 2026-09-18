import { useState } from 'react'
import { Link, useLocation, useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Button, Input, Card, ErrorMessage } from '../components/ui'

export default function Login() {
  const { login, isAuthenticated, initializing } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  // Already signed in? Skip the form.
  if (!initializing && isAuthenticated) {
    return <Navigate to={isAdmin ? '/admin' : from} replace />
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const me = await login(email.trim(), password)
      if (me?.role === 'ADMIN') {
        const dest = location.state?.from?.pathname?.startsWith('/admin')
          ? location.state.from.pathname
          : '/admin'
        navigate(dest, { replace: true })
      } else {
        navigate(from, { replace: true })
      }
    } catch (err) {
      setError(err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col justify-center py-8">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-slate-900">Welcome back</h1>
        <p className="mt-1 text-sm text-slate-500">
          Sign in to your ShopEase account
        </p>
      </div>

      <Card>
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          {error && <ErrorMessage error={error} />}

          <Input
            label="Email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
          <Input
            label="Password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />

          <Button type="submit" fullWidth loading={submitting}>
            Sign in
          </Button>
        </form>
      </Card>

      <p className="mt-5 text-center text-sm text-slate-500">
        Don’t have an account?{' '}
        <Link to="/register" className="font-medium text-brand-600 hover:text-brand-700">
          Create one
        </Link>
      </p>
    </div>
  )
}
