import { Link } from 'react-router-dom'
import { buttonClasses } from '../components/ui/Button'

export default function NotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
      <span className="text-6xl font-bold tracking-tight text-brand-600">404</span>
      <h1 className="mt-3 text-2xl font-bold text-slate-900">Page not found</h1>
      <p className="mt-2 max-w-md text-sm text-slate-500">
        The page you were looking for doesn’t exist or may have moved.
      </p>
      <div className="mt-6 flex gap-3">
        <Link to="/" className={buttonClasses({ variant: 'outline' })}>
          Home
        </Link>
        <Link to="/products" className={buttonClasses({ variant: 'primary' })}>
          Browse products
        </Link>
      </div>
    </div>
  )
}
