import { useState } from 'react'
import { Link, useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Button, Input, Card, ErrorMessage } from '../components/ui'

export default function Register() {
  const { register, isAuthenticated, initializing } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirm: '',
  })
  const [fieldErrors, setFieldErrors] = useState({})
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  if (!initializing && isAuthenticated) {
    return <Navigate to="/" replace />
  }

  const setField = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

  const validate = () => {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Please enter your name.'
    if (!form.email.trim()) errs.email = 'Please enter your email.'
    if (form.password.length < 8)
      errs.password = 'Password must be at least 8 characters.'
    if (form.confirm !== form.password)
      errs.confirm = 'Passwords do not match.'
    setFieldErrors(errs)
    return Object.keys(errs).length === 0
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    if (!validate()) return
    setSubmitting(true)
    try {
      await register(form.name.trim(), form.email.trim(), form.password)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col justify-center py-8">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-slate-900">Create your account</h1>
        <p className="mt-1 text-sm text-slate-500">
          Join ShopEase to start shopping
        </p>
      </div>

      <Card>
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          {error && <ErrorMessage error={error} />}

          <Input
            label="Name"
            autoComplete="name"
            value={form.name}
            onChange={setField('name')}
            error={fieldErrors.name}
            placeholder="Jane Doe"
            required
          />
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={setField('email')}
            error={fieldErrors.email}
            placeholder="you@example.com"
            required
          />
          <Input
            label="Password"
            type="password"
            autoComplete="new-password"
            value={form.password}
            onChange={setField('password')}
            error={fieldErrors.password}
            hint="At least 8 characters"
            placeholder="••••••••"
            required
          />
          <Input
            label="Confirm password"
            type="password"
            autoComplete="new-password"
            value={form.confirm}
            onChange={setField('confirm')}
            error={fieldErrors.confirm}
            placeholder="••••••••"
            required
          />

          <Button type="submit" fullWidth loading={submitting}>
            Create account
          </Button>
        </form>
      </Card>

      <p className="mt-5 text-center text-sm text-slate-500">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-brand-600 hover:text-brand-700">
          Sign in
        </Link>
      </p>
    </div>
  )
}
