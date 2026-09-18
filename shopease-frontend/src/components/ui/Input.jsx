import { useId } from 'react'

/**
 * Labeled text input with optional hint and error message.
 * Any native <input> prop (type, value, onChange, placeholder, required...)
 * passes straight through.
 */
export default function Input({
  label,
  id,
  error,
  hint,
  className = '',
  ...rest
}) {
  const generatedId = useId()
  const inputId = id || generatedId

  return (
    <div className={className}>
      {label && (
        <label htmlFor={inputId} className="label-base">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`input-base ${error ? 'border-rose-400 focus:border-rose-400 focus:ring-rose-200' : ''}`}
        aria-invalid={error ? 'true' : undefined}
        {...rest}
      />
      {hint && !error && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
    </div>
  )
}
