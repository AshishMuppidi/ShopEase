import { useId } from 'react'

/** Labeled multi-line text input. Mirrors the Input component's API. */
export default function Textarea({
  label,
  id,
  error,
  hint,
  rows = 4,
  className = '',
  ...rest
}) {
  const generatedId = useId()
  const textareaId = id || generatedId

  return (
    <div className={className}>
      {label && (
        <label htmlFor={textareaId} className="label-base">
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        rows={rows}
        className={`input-base ${error ? 'border-rose-400 focus:border-rose-400 focus:ring-rose-200' : ''}`}
        aria-invalid={error ? 'true' : undefined}
        {...rest}
      />
      {hint && !error && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
    </div>
  )
}
