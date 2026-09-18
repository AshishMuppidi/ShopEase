import { useId } from 'react'

/**
 * Labeled select. Pass either `options` (array of {value,label}) or children
 * <option> elements. Mirrors the Input component's label/error/hint API.
 */
export default function Select({
  label,
  id,
  error,
  hint,
  options,
  children,
  className = '',
  ...rest
}) {
  const generatedId = useId()
  const selectId = id || generatedId

  return (
    <div className={className}>
      {label && (
        <label htmlFor={selectId} className="label-base">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={`input-base pr-8 ${error ? 'border-rose-400 focus:border-rose-400 focus:ring-rose-200' : ''}`}
        aria-invalid={error ? 'true' : undefined}
        {...rest}
      >
        {options
          ? options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))
          : children}
      </select>
      {hint && !error && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
    </div>
  )
}
