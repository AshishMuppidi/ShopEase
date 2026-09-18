import { getErrorMessage } from '../../lib/errors'

/**
 * Inline error banner. Accepts either a raw axios `error` or a plain `message`
 * string, and renders a friendly, non-technical explanation. Optionally shows
 * a "Try again" button when `onRetry` is provided.
 */
export default function ErrorMessage({
  error,
  message,
  onRetry,
  className = '',
}) {
  const text = message || getErrorMessage(error)

  return (
    <div
      role="alert"
      className={`flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 ${className}`}
    >
      <svg
        className="mt-0.5 h-5 w-5 flex-shrink-0 text-rose-500"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.94 6.94a.75.75 0 111.06 1.06L9.06 10l.94.94a.75.75 0 11-1.06 1.06L8 11.06l-.94.94A.75.75 0 016 10.94L6.94 10 6 9.06A.75.75 0 017.06 8L8 8.94l.94-.94z"
          clipRule="evenodd"
        />
      </svg>
      <div className="flex-1">
        <p>{text}</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-2 font-medium text-rose-700 underline underline-offset-2 hover:text-rose-900"
          >
            Try again
          </button>
        )}
      </div>
    </div>
  )
}
