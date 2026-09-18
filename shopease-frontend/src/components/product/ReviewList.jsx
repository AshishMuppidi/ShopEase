import { StarRating } from '../ui'
import { formatDate } from '../../lib/format'

export default function ReviewList({ reviews, onHelpful }) {
  if (!reviews || reviews.length === 0) return (
    <p className="text-slate-500 text-sm">No reviews yet. Be the first to review this product!</p>
  )

  const getInitials = (name) => name ? name.substring(0, 2).toUpperCase() : 'U'
  
  const getAvatarColor = (name) => {
    if (!name) return 'bg-slate-300'
    const charCode = name.charCodeAt(0)
    const colors = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500']
    return colors[charCode % colors.length]
  }

  return (
    <div className="space-y-6 mt-6">
      {reviews.map(review => (
        <div key={review.id} className="border-b border-slate-100 pb-6 last:border-0">
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${getAvatarColor(review.userName)}`}>
              {getInitials(review.userName)}
            </div>
            <div>
              <div className="font-medium text-sm text-slate-900">{review.userName || 'Verified Buyer'}</div>
              <div className="text-xs text-slate-500">{formatDate(review.createdAt)}</div>
            </div>
          </div>
          
          <div className="mb-2 flex items-center gap-2">
            <div className="bg-green-600 px-1.5 py-0.5 rounded text-white inline-flex text-xs items-center gap-1">
              {review.rating} ★
            </div>
            {review.title && <h4 className="font-semibold text-slate-800 text-sm">{review.title}</h4>}
          </div>
          
          <p className="text-sm text-slate-600 leading-relaxed mb-4">{review.comment}</p>
          
          <div className="flex items-center gap-4 text-xs">
            <button 
              onClick={() => onHelpful(review.id)}
              className="flex items-center gap-1 text-slate-500 hover:text-brand-600 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"></path></svg>
              Helpful {review.helpfulVotes > 0 && `(${review.helpfulVotes})`}
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
