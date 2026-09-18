export default function StarRating({ rating = 0, count = 0, size = 'md', showCount = true }) {
  const sizes = { sm: 'h-3 w-3', md: 'h-4 w-4', lg: 'h-5 w-5' }
  const starClass = sizes[size] || sizes.md
  
  const renderStar = (index) => {
    // Generate a unique ID to avoid conflicting linear gradients
    const id = `star-fill-${Math.random().toString(36).substr(2, 9)}-${index}`
    const fill = rating - index >= 1 ? '100%' : rating - index > 0 ? `${(rating - index) * 100}%` : '0%'
    return (
      <svg key={index} viewBox="0 0 24 24" className={`${starClass} text-yellow-400`} fill="currentColor" stroke="currentColor" strokeWidth="2">
        <defs>
          <linearGradient id={id}>
            <stop offset={fill} stopColor="currentColor" />
            <stop offset={fill} stopColor="transparent" />
          </linearGradient>
        </defs>
        <path fill={`url(#${id})`} d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    )
  }

  return (
    <div className="flex items-center gap-1">
      <div className="flex text-yellow-400">
        {[0, 1, 2, 3, 4].map(renderStar)}
      </div>
      {showCount && <span className="text-xs text-slate-500 ml-1">({count})</span>}
    </div>
  )
}
