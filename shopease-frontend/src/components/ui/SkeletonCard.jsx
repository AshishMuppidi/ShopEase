export default function SkeletonCard() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div className="aspect-square skeleton-shimmer" />
      <div className="p-3 space-y-2">
        <div className="h-3 skeleton-shimmer rounded w-3/4" />
        <div className="h-3 skeleton-shimmer rounded w-1/2" />
        <div className="h-4 skeleton-shimmer rounded w-1/3 mt-2" />
      </div>
    </div>
  )
}
