import { useState } from 'react'
import { Button, ErrorMessage } from '../ui'
import { reviewsApi } from '../../api/reviews'

export default function ReviewForm({ productId, onSuccess }) {
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [title, setTitle] = useState('')
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (rating === 0) {
      setError('Please select a rating')
      return
    }
    setLoading(true)
    setError(null)
    
    try {
      await reviewsApi.create(productId, { rating, title, comment })
      onSuccess()
    } catch (err) {
      const msg = err.response?.data?.message || err.message
      if (msg.includes('already reviewed')) {
        setError('You have already reviewed this product.')
      } else {
        setError(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-slate-50 p-6 rounded-xl border border-slate-200 mt-6">
      <h3 className="text-lg font-bold text-slate-900 mb-4">Write a Review</h3>
      
      {error && <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-100">{error}</div>}
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-700 mb-2">Overall Rating *</label>
        <div className="flex gap-1" onMouseLeave={() => setHoverRating(0)}>
          {[1, 2, 3, 4, 5].map(star => (
            <button
              key={star}
              type="button"
              className="focus:outline-none"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
            >
              <svg 
                className={`w-8 h-8 ${star <= (hoverRating || rating) ? 'text-yellow-400' : 'text-slate-300'}`} 
                fill="currentColor" 
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </button>
          ))}
        </div>
      </div>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
        <input 
          type="text" 
          value={title} 
          onChange={e => setTitle(e.target.value)} 
          className="w-full rounded-md border-slate-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm px-3 py-2 border bg-white"
          placeholder="Brief summary of your review"
        />
      </div>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-700 mb-1">Review</label>
        <textarea 
          rows={4}
          value={comment} 
          onChange={e => setComment(e.target.value)} 
          className="w-full rounded-md border-slate-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm px-3 py-2 border bg-white"
          placeholder="What did you like or dislike?"
        />
      </div>
      
      <Button type="submit" loading={loading} disabled={rating === 0}>
        Submit Review
      </Button>
    </form>
  )
}
