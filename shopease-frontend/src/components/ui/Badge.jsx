const TONES = {
  neutral: 'bg-slate-100 text-slate-700',
  brand: 'bg-brand-50 text-brand-700',
  success: 'bg-emerald-100 text-emerald-800',
  warning: 'bg-amber-100 text-amber-800',
  danger: 'bg-rose-100 text-rose-800',
  info: 'bg-sky-100 text-sky-800',
}

/**
 * Small pill label. Use `tone` for the built-in palette, or pass an explicit
 * `className` (e.g. from STATUS_STYLES) to fully control the colors.
 */
export default function Badge({
  children,
  tone = 'neutral',
  className,
  ...rest
}) {
  const color = className || TONES[tone] || TONES.neutral
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${color}`}
      {...rest}
    >
      {children}
    </span>
  )
}
