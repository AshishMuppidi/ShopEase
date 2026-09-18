import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { recommendationsApi } from '../api/recommendations'
import { productsApi } from '../api/products'
import ProductCard from '../components/product/ProductCard'
import { CountdownTimer, LoadingSpinner, ErrorMessage, Breadcrumb, SkeletonCard } from '../components/ui'

export default function Deals() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isFallback, setIsFallback] = useState(false)
  
  useEffect(() => {
    const loadDeals = async () => {
      setLoading(true)
      try {
        const data = await recommendationsApi.deals({ page: 0, size: 20 })
        if (data && data.content && data.content.length > 0) {
          setProducts(data.content)
        } else {
          throw new Error('No deals found')
        }
      } catch (err) {
        // Fallback to featured products if deals endpoint fails
        setIsFallback(true)
        try {
          const fbData = await productsApi.list({ page: 0, size: 20, sortBy: 'id' })
          setProducts(fbData.content || [])
        } catch (fbErr) {
          setError(fbErr)
        }
      } finally {
        setLoading(false)
      }
    }
    loadDeals()
  }, [])

  // Midnight today
  const targetDate = new Date()
  targetDate.setHours(23, 59, 59, 999)

  return (
    <div>
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Deals' }]} />
      
      {/* Hero Banner */}
      <div className="bg-slate-900 rounded-2xl overflow-hidden mb-8 relative flex flex-col md:flex-row items-center">
        <div className="p-8 md:p-12 md:w-1/2 flex flex-col items-center md:items-start text-center md:text-left z-10">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            <span className="text-yellow-400">Mega</span> Deals
          </h1>
          <p className="text-slate-300 mb-8 max-w-md text-lg">
            Hurry! These special prices end tonight. Grab your favorite products before they're gone.
          </p>
          <div className="bg-white/10 backdrop-blur rounded-xl p-4 border border-white/20">
            <div className="text-xs text-white/80 uppercase tracking-widest font-bold mb-2 text-center">Ends In</div>
            <div className="text-3xl md:text-4xl text-white font-bold tracking-wider">
              <CountdownTimer targetDate={targetDate} />
            </div>
          </div>
        </div>
        <div className="hidden md:block w-1/2 absolute right-0 top-0 bottom-0 h-full">
          <div className="h-full w-full bg-gradient-to-l from-brand-600 to-transparent flex items-center justify-center p-12">
            <span className="text-[12rem]">🏷️</span>
          </div>
        </div>
      </div>
      
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900">
          {isFallback ? 'Featured Products' : 'Deals of the Day'}
        </h2>
        <div className="text-sm text-slate-500">
          {products.length} items
        </div>
      </div>
      
      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {[...Array(10)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : error ? (
        <ErrorMessage error={error} />
      ) : products.length === 0 ? (
        <div className="text-center py-12 text-slate-500 bg-white rounded-xl border border-slate-200">
          No deals available right now.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {products.map(p => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  )
}
