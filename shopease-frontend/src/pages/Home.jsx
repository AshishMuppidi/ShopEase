import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { productsApi } from '../api/products'
import { categoriesApi } from '../api/categories'
import { normalizePage } from '../lib/page'
import ProductCard from '../components/product/ProductCard'
import { LoadingSpinner, ErrorMessage } from '../components/ui'
import HeroBannerSlider from '../components/home/HeroBannerSlider'
import CategoryTiles from '../components/home/CategoryTiles'
import DealOfTheDay from '../components/home/DealOfTheDay'
import BrandBanner from '../components/home/BrandBanner'

export default function Home() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = () => {
    setLoading(true)
    setError(null)
    Promise.all([
      productsApi.list({ page: 0, size: 10, sortBy: 'id' }),
      categoriesApi.list().catch(() => []),
    ])
      .then(([productPage, cats]) => {
        setProducts(normalizePage(productPage).content)
        setCategories(Array.isArray(cats) ? cats : [])
      })
      .catch((err) => setError(err))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  // Setup deals deadline to midnight today
  const dealEndTime = new Date()
  dealEndTime.setHours(23, 59, 59, 999)

  return (
    <div className="space-y-6 md:space-y-8">
      <HeroBannerSlider />
      
      {categories.length > 0 && <CategoryTiles categories={categories} />}

      {!loading && !error && products.length > 0 && (
        <DealOfTheDay products={products.slice(0, 6)} targetDate={dealEndTime} />
      )}

      {/* Featured products */}
      <section className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 sm:p-6">
        <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4">
          <h2 className="text-xl font-bold text-slate-900">
            Featured Products
          </h2>
          <Link
            to="/products"
            className="text-sm font-medium text-brand-600 hover:text-brand-700 bg-brand-50 px-3 py-1.5 rounded"
          >
            View All →
          </Link>
        </div>

        {loading ? (
          <LoadingSpinner size="lg" />
        ) : error ? (
          <ErrorMessage error={error} onRetry={load} />
        ) : products.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 py-12 text-center text-sm text-slate-500">
            No products available yet. Check back soon.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>

      <BrandBanner />
    </div>
  )
}
