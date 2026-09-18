import { StarRating } from '../ui'

export default function ReviewSummary({ summary }) {
  if (!summary) return null

  const { averageRating = 0, totalCount = 0, ratingDistribution = {} } = summary

  const getBarColor = (stars) => {
    if (stars >= 4) return 'bg-green-500'
    if (stars === 3) return 'bg-orange-500'
    return 'bg-red-500'
  }

  return (
    <div className="flex flex-col sm:flex-row gap-8 items-center sm:items-start p-6 bg-white rounded-xl border border-slate-200">
      <div className="flex flex-col items-center text-center w-32">
        <div className="text-4xl font-bold text-slate-900 mb-2">{averageRating.toFixed(1)}</div>
        <div className="mb-1 text-slate-800">
          <StarRating rating={averageRating} showCount={false} size="md" />
        </div>
        <div className="text-sm text-slate-500">{totalCount} ratings</div>
      </div>
      
      <div className="flex-1 w-full max-w-sm">
        {[5, 4, 3, 2, 1].map(stars => {
          const count = ratingDistribution[stars] || 0
          const percent = totalCount > 0 ? (count / totalCount) * 100 : 0
          return (
            <div key={stars} className="flex items-center gap-3 mb-2 text-sm">
              <span className="w-8 text-right font-medium text-slate-600">{stars} ★</span>
              <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                <div 
                  className={`h-full ${getBarColor(stars)}`} 
                  style={{ width: `${percent}%` }}
                />
              </div>
              <span className="w-10 text-slate-500 text-xs">{count}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
