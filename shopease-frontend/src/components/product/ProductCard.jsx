import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { StarRating } from '../ui'
import { useAuth } from '../../context/AuthContext'
import { useWishlist } from '../../context/WishlistContext'
import { formatPrice } from '../../lib/format'

function Placeholder() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-slate-300">
      <svg className="h-10 w-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M3 15l5-5 4 4 3-3 6 6" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="8.5" cy="8.5" r="1.5" />
      </svg>
    </div>
  )
}

export default function ProductCard({ product }) {
  const [imgOk, setImgOk] = useState(Boolean(product?.thumbnail))
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const { addItem: addToWishlist, removeItem: removeFromWishlist, isWishlisted } = useWishlist()
  
  // Since we don't have price on product object itself (it's on variants),
  // we could potentially display it if we had a "startingPrice".
  // Assuming backend doesn't send price, we keep the original logic but add UI elements.
  
  const wishlisted = isWishlisted(product.id)
  
  const handleWishlist = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    if (wishlisted) {
      removeFromWishlist(product.id)
    } else {
      addToWishlist(product.id)
    }
  }

  return (
    <Link
      to={`/products/${product.id}`}
      className="group flex flex-col h-full overflow-hidden rounded-xl border border-slate-200 bg-white hover:shadow-lg transition-all duration-300"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-slate-50">
        {imgOk ? (
          <img
            src={product.thumbnail}
            alt={product.name}
            loading="lazy"
            onError={() => setImgOk(false)}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <Placeholder />
        )}
        
        {/* Discount Badge */}
        {product.discountPercent > 0 && (
          <div className="absolute top-2 left-0 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-r-sm shadow-sm">
            -{Math.round(product.discountPercent)}%
          </div>
        )}
        
        {/* Wishlist Button */}
        {isAuthenticated && (
          <button 
            onClick={handleWishlist}
            className={`absolute top-2 right-2 p-1.5 rounded-full bg-white/80 backdrop-blur shadow-sm transition-colors ${wishlisted ? 'text-red-500' : 'text-slate-400 hover:text-red-500'}`}
          >
            <svg className="w-4 h-4" fill={wishlisted ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
            </svg>
          </button>
        )}
        
        {/* Hover Add to Cart Overlay */}
        <div className="absolute inset-x-0 bottom-0 p-2 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 md:block hidden">
          <button className="w-full bg-brand-600 text-white font-medium py-2 rounded shadow text-sm hover:bg-brand-700">
            View Details
          </button>
        </div>
      </div>
      
      <div className="flex flex-col flex-1 p-3 sm:p-4 border-t border-slate-100">
        <div className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 line-clamp-1">
          {product.brand || product.categoryName || 'Product'}
        </div>
        <h3 className="line-clamp-2 text-xs sm:text-sm font-medium text-slate-900 group-hover:text-brand-600 transition-colors mb-2 min-h-[32px] sm:min-h-[40px]">
          {product.name}
        </h3>
        
        <div className="mt-auto">
          {/* Rating */}
          <div className="mb-2 flex items-center">
            {product.averageRating > 0 && <StarRating rating={product.averageRating || 0} size="sm" />}
            {product.reviewCount > 0 && <span className="text-xs text-slate-500 ml-1">({product.reviewCount})</span>}
          </div>
          
          <div className="flex items-center justify-between">
            <div className="font-bold text-sm sm:text-base text-slate-900">
              {product.minPrice ? formatPrice(product.minPrice) : (product.price ? formatPrice(product.price) : 'Check Price')}
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
