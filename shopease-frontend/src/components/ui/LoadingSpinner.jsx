const SIZES = {
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-10 w-10 border-[3px]',
}

/**
 * Spinning ring. When `fullPage` is set it centers itself in a tall area,
 * suitable as a route-level loading state.
 */
export default function LoadingSpinner({
  size = 'md',
  fullPage = false,
  label = 'Loading…',
  className = '',
}) {
  const spinner = (
    <span
      role="status"
      aria-label={label}
      className={`inline-block animate-spin rounded-full border-brand-500 border-t-transparent ${SIZES[size] || SIZES.md} ${className}`}
    />
  )

  if (!fullPage) return spinner

  return (
    <div className="flex min-h-[40vh] w-full items-center justify-center">
      {spinner}
    </div>
  )
}
