import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useLocation, useParams } from 'react-router-dom'
import { productsApi } from '../api/products'
import { reviewsApi } from '../api/reviews'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useWishlist } from '../context/WishlistContext'
import { useToast } from '../context/ToastContext'
import { formatPrice } from '../lib/format'
import { getErrorMessage } from '../lib/errors'
import { Button, Badge, LoadingSpinner, ErrorMessage, Breadcrumb, SkeletonCard } from '../components/ui'
import ReviewSummary from '../components/product/ReviewSummary'
import ReviewList from '../components/product/ReviewList'
import ReviewForm from '../components/product/ReviewForm'
import RelatedProducts from '../components/product/RelatedProducts'

function VariantAttributes({ attributes }) {
  if (!attributes) return null
  let parsed
  try {
    parsed = JSON.parse(attributes)
  } catch {
    parsed = null
  }
  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
    return (
      <span className="flex flex-wrap gap-x-3 gap-y-1">
        {Object.entries(parsed).map(([k, v]) => (
          <span key={k} className="text-xs text-slate-500">
            <span className="capitalize">{k}</span>:{' '}
            <span className="font-medium text-slate-700">{String(v)}</span>
          </span>
        ))}
      </span>
    )
  }
  return <span className="text-xs text-slate-500">{attributes}</span>
}

export default function ProductDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, user } = useAuth()
  const { addItem: addToCart } = useCart()
  const { addItem: addToWishlist, removeItem: removeFromWishlist, isWishlisted } = useWishlist()
  const { addToast } = useToast()

  const [product, setProduct] = useState(null)
  const [variants, setVariants] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [activeImage, setActiveImage] = useState(null)
  
  // Reviews state
  const [reviews, setReviews] = useState([])
  const [reviewSummary, setReviewSummary] = useState(null)
  const [loadingReviews, setLoadingReviews] = useState(false)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [actionError, setActionError] = useState(null)
  const [addingToCart, setAddingToCart] = useState(false)
  const [savingWishlist, setSavingWishlist] = useState(false)

  const loadReviews = useCallback(async () => {
    if (!id) return
    setLoadingReviews(true)
    try {
      const [sum, listData] = await Promise.all([
        reviewsApi.summary(id).catch(() => null),
        reviewsApi.list(id, { page: 0, size: 20, sort: 'createdAt,desc' }).catch(() => ({ content: [] }))
      ])
      if (sum) setReviewSummary(sum)
      if (listData && listData.content) setReviews(listData.content)
    } catch (err) {
      console.error("Failed to load reviews", err)
    } finally {
      setLoadingReviews(false)
    }
  }, [id])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [prod, vars] = await Promise.all([
        productsApi.get(id),
        productsApi.variants(id).catch(() => []),
      ])
      setProduct(prod)
      const list = Array.isArray(vars) ? vars : []
      setVariants(list)
      const preferred = list.find((v) => v.active && v.availableQuantity > 0) || list[0] || null
      setSelectedId(preferred ? preferred.id : null)
      setActiveImage(prod?.thumbnail || (prod?.images && prod.images[0]) || null)
      
      // Load reviews after product details
      loadReviews()
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [id, loadReviews])

  useEffect(() => {
    load()
  }, [load])

  const selectedVariant = useMemo(
    () => variants.find((v) => v.id === selectedId) || null,
    [variants, selectedId],
  )

  const maxQty = selectedVariant?.availableQuantity ?? 0
  const inStock = maxQty > 0

  useEffect(() => {
    setQuantity((q) => Math.min(Math.max(1, q), Math.max(1, maxQty)))
    setActionError(null)
  }, [selectedId, maxQty])

  const requireAuth = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location } })
      return false
    }
    return true
  }

  const handleAddToCart = async () => {
    if (!requireAuth() || !selectedVariant) return
    setAddingToCart(true)
    setActionError(null)
    try {
      await addToCart(selectedVariant.id, quantity)
      addToast('Added to your cart.', 'success')
    } catch (err) {
      setActionError(getErrorMessage(err))
      addToast(getErrorMessage(err), 'error')
    } finally {
      setAddingToCart(false)
    }
  }

  const handleWishlist = async () => {
    if (!requireAuth() || !selectedVariant) return
    setSavingWishlist(true)
    setActionError(null)
    try {
      if (isWishlisted(selectedVariant.id)) {
        await removeFromWishlist(selectedVariant.id)
        addToast('Removed from wishlist.', 'info')
      } else {
        await addToWishlist(selectedVariant.id)
        addToast('Added to wishlist.', 'success')
      }
    } catch (err) {
      setActionError(getErrorMessage(err))
      addToast(getErrorMessage(err), 'error')
    } finally {
      setSavingWishlist(false)
    }
  }
  
  const handleReviewSuccess = () => {
    addToast('Review submitted successfully!', 'success')
    loadReviews()
  }

  const handleHelpful = async (reviewId) => {
    if (!requireAuth()) return
    try {
      await reviewsApi.toggleHelpful(reviewId)
      addToast('Marked as helpful.', 'success')
      loadReviews()
    } catch (err) {
      addToast(getErrorMessage(err), 'error')
    }
  }

  if (loading) return <div className="py-12 flex justify-center"><LoadingSpinner size="lg" /></div>

  if (error) {
    const notFound = error?.response?.status === 404
    return (
      <div className="py-8 bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col items-center p-12">
        {notFound ? (
          <div className="mx-auto max-w-md text-center">
            <h1 className="text-xl font-bold text-slate-900 mb-2">Product not found</h1>
            <p className="text-sm text-slate-500">
              This product may have been removed or the link is incorrect.
            </p>
            <Link to="/products" className="mt-6 inline-block bg-brand-600 text-white px-6 py-2 rounded-md font-medium hover:bg-brand-700">
              Back to products
            </Link>
          </div>
        ) : (
          <ErrorMessage error={error} onRetry={load} />
        )}
      </div>
    )
  }

  const gallery = product.images && product.images.length > 0 ? product.images : product.thumbnail ? [product.thumbnail] : []
  const wishlisted = selectedVariant && isWishlisted(selectedVariant.id)
  
  const hasReviewed = user && reviews.some(r => r.userId === user.id)

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <Breadcrumb items={[
        { label: 'Home', href: '/' },
        { label: product.categoryName || 'Products', href: product.categoryId ? `/products?categoryId=${product.categoryId}` : '/products' },
        { label: product.name }
      ]} />

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-12">
        <div className="grid lg:grid-cols-2">
          {/* Gallery - Left side */}
          <div className="p-6 md:p-8 border-b lg:border-b-0 lg:border-r border-slate-100 flex flex-col h-full">
            <div className="aspect-square overflow-hidden rounded-xl bg-slate-50 relative flex items-center justify-center mb-6">
              {activeImage ? (
                <img
                  src={activeImage}
                  alt={product.name}
                  className="max-h-full w-auto object-contain p-4 mix-blend-multiply"
                  onError={() => setActiveImage(null)}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-slate-300">
                  <svg className="h-24 w-24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <path d="M3 15l5-5 4 4 3-3 6 6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}
              {product.discountPercent > 0 && (
                <div className="absolute top-4 left-0 bg-green-500 text-white font-bold px-3 py-1 rounded-r-md shadow-sm">
                  {product.discountPercent}% OFF
                </div>
              )}
            </div>
            
            {gallery.length > 1 && (
              <div className="flex gap-3 overflow-x-auto py-2">
                {gallery.map((src, i) => (
                  <button
                    key={`${src}-${i}`}
                    type="button"
                    onClick={() => setActiveImage(src)}
                    className={`h-20 w-20 flex-shrink-0 rounded-lg border-2 p-1 bg-white ${
                      activeImage === src ? 'border-brand-500' : 'border-slate-200 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={src} alt="" className="h-full w-full object-contain" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Details - Right side */}
          <div className="p-6 md:p-8 flex flex-col h-full bg-slate-50/50">
            <div className="mb-6">
              {product.brand && (
                <p className="text-sm font-bold text-brand-700 tracking-wider uppercase mb-2">{product.brand}</p>
              )}
              <h1 className="text-2xl md:text-3xl font-medium text-slate-900 leading-tight mb-3">{product.name}</h1>
              
              <div className="flex items-center gap-4 mb-4">
                {reviewSummary && (
                  <div className="flex items-center gap-2">
                    <div className="bg-green-600 text-white px-2 py-0.5 rounded text-sm font-medium flex items-center gap-1">
                      {reviewSummary.averageRating.toFixed(1)} ★
                    </div>
                    <span className="text-sm text-slate-500 font-medium">{reviewSummary.totalCount} Ratings</span>
                  </div>
                )}
              </div>
              
              <div className="text-3xl font-semibold text-slate-900 mt-2 flex items-end gap-3">
                {selectedVariant ? formatPrice(selectedVariant.price) : 'Select an option'}
                {product.originalPrice && selectedVariant && (
                  <span className="text-lg text-slate-400 line-through font-normal mb-1">
                    {formatPrice(product.originalPrice)}
                  </span>
                )}
              </div>
              {selectedVariant && (
                <p className="text-xs text-green-600 font-medium mt-1">Inclusive of all taxes</p>
              )}
            </div>

            <div className="flex-1">
              {/* Variant picker */}
              {variants.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-sm font-semibold text-slate-900 mb-3 uppercase tracking-wider">Available Options</h3>
                  <div className="grid gap-3">
                    {variants.map((v) => {
                      const disabled = !v.active || v.availableQuantity <= 0
                      const selected = v.id === selectedId
                      return (
                        <button
                          key={v.id}
                          type="button"
                          disabled={disabled}
                          onClick={() => setSelectedId(v.id)}
                          className={`flex items-center justify-between rounded-lg border-2 px-4 py-3 text-left transition-all ${
                            selected
                              ? 'border-brand-500 bg-brand-50/50 shadow-sm'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          } ${disabled ? 'cursor-not-allowed opacity-50 bg-slate-50' : ''}`}
                        >
                          <div className="min-w-0 pr-4">
                            <span className="block text-sm font-bold text-slate-800 mb-0.5 truncate">{v.sku}</span>
                            <VariantAttributes attributes={v.attributes} />
                          </div>
                          <div className="text-right">
                            <span className="block text-sm font-bold text-slate-900">{formatPrice(v.price)}</span>
                            {disabled ? (
                              <span className="text-xs text-red-500 font-medium">Out of stock</span>
                            ) : (
                              <span className="text-xs text-green-600 font-medium">In stock</span>
                            )}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Delivery info placeholder */}
              <div className="bg-white rounded-lg border border-slate-200 p-4 mb-8">
                <div className="flex gap-3 mb-2">
                  <span className="text-slate-400">🚚</span>
                  <div>
                    <div className="text-sm font-bold text-slate-800">Free Delivery</div>
                    <div className="text-xs text-slate-500">Enter pincode for exact delivery dates</div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              {selectedVariant && (
                <div className="space-y-4">
                  <div className="flex items-center gap-4 border-t border-slate-200 pt-6">
                    <div className="text-sm font-medium text-slate-700">Qty:</div>
                    <div className="flex items-center rounded border border-slate-300 bg-white shadow-sm overflow-hidden">
                      <button
                        className="px-3 py-1.5 text-xl font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-30"
                        onClick={() => setQuantity(q => Math.max(1, q - 1))}
                        disabled={quantity <= 1 || !inStock}
                      >−</button>
                      <span className="w-10 text-center font-semibold text-slate-800">{quantity}</span>
                      <button
                        className="px-3 py-1.5 text-xl font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-30"
                        onClick={() => setQuantity(q => Math.min(maxQty, q + 1))}
                        disabled={quantity >= maxQty || !inStock}
                      >+</button>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <Button 
                      size="lg" 
                      className={`flex-1 h-14 text-lg font-bold shadow-md ${inStock ? 'bg-[#ff9f00] hover:bg-[#f39800] text-white border-none' : ''}`}
                      onClick={handleAddToCart}
                      disabled={!inStock}
                      loading={addingToCart}
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                      {inStock ? 'ADD TO CART' : 'OUT OF STOCK'}
                    </Button>
                    <Button 
                      variant="outline"
                      size="lg"
                      className="sm:w-16 h-14 flex items-center justify-center p-0 border-slate-300"
                      onClick={handleWishlist}
                      loading={savingWishlist}
                    >
                      <svg className={`w-6 h-6 ${wishlisted ? 'text-red-500 fill-current' : 'text-slate-400'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Description */}
        {product.description && (
          <div className="border-t border-slate-200 p-6 md:p-8 bg-white">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Product Details</h2>
            <div className="prose prose-slate max-w-none text-sm text-slate-600 leading-relaxed whitespace-pre-line">
              {product.description}
            </div>
          </div>
        )}
      </div>

      {/* Reviews Section */}
      <div className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-900">Ratings & Reviews</h2>
        </div>
        
        {loadingReviews ? (
          <div className="py-8 text-center text-slate-500">Loading reviews...</div>
        ) : (
          <>
            <ReviewSummary summary={reviewSummary} />
            
            {isAuthenticated && !hasReviewed ? (
              <ReviewForm productId={id} onSuccess={handleReviewSuccess} />
            ) : !isAuthenticated && (
              <div className="mt-6 bg-slate-50 p-4 rounded-lg text-center text-sm border border-slate-200">
                <Link to="/login" className="text-brand-600 font-bold hover:underline">Log in</Link> to write a review.
              </div>
            )}
            
            <div className="mt-8 border-t border-slate-100 pt-6">
              <ReviewList reviews={reviews} onHelpful={handleHelpful} />
            </div>
          </>
        )}
      </div>

      {/* Related Products */}
      <RelatedProducts productId={id} />
    </div>
  )
}
