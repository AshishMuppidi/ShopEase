/**
 * Empty-state placeholder — an invitation to act, not just a shrug.
 * Pass an `icon` node, a `title`, optional `message`, and an optional `action`
 * (e.g. a button or link).
 */
export default function EmptyState({
  icon,
  title,
  message,
  action,
  className = '',
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white/60 px-6 py-14 text-center ${className}`}
    >
      {icon && (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-slate-800">{title}</h3>
      {message && (
        <p className="mt-1 max-w-sm text-sm text-slate-500">{message}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
