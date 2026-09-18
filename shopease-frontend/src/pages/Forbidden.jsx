import { Link } from 'react-router-dom'
import { buttonClasses } from '../components/ui/Button'

export default function Forbidden() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-100 text-rose-600">
        <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="5" y="11" width="14" height="10" rx="2" />
          <path d="M8 11V7a4 4 0 0 1 8 0v4" strokeLinecap="round" />
        </svg>
      </span>
      <h1 className="mt-5 text-2xl font-bold text-slate-900">Access denied</h1>
      <p className="mt-2 max-w-md text-sm text-slate-500">
        This area is for administrators only. If you believe you should have
        access, check that your account has the admin role.
      </p>
      <Link to="/" className={`mt-6 ${buttonClasses({ variant: 'primary' })}`}>
        Back to home
      </Link>
    </div>
  )
}
