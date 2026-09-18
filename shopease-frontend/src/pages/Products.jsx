import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { productsApi } from '../api/products'
import { categoriesApi } from '../api/categories'
import { normalizePage } from '../lib/page'
import ProductCard from '../components/product/ProductCard'
import Pagination from '../components/Pagination'
import { Button, Select, SkeletonCard, EmptyState, ErrorMessage, PriceRangeSlider } from '../components/ui'
import { Breadcrumb } from '../components/ui'

const PAGE_SIZE = 12

const SORT_OPTIONS = [
  { value: 'id', label: 'Featured' },
  { value: 'price,asc', label: 'Price: Low to High' },
  { value: 'price,desc', label: 'Price: High to Low' },
  { value: 'createdAt,desc', label: 'Newest First' },
  { value: 'averageRating,desc', label: 'Customer Rating' }
]

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams()

  const page = Number(searchParams.get('page') || 0)
  const sortBy = searchParams.get('sortBy') || 'id'
  const categoryId = searchParams.get('categoryId') || ''
  const keyword = searchParams.get('keyword') || ''
  
  // Custom Filters
  const minPriceParam = searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : 0
  const maxPriceParam = searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : 100000
  const minRatingParam = searchParams.get('minRating') ? Number(searchParams.get('minRating')) : 0

  const [categories, setCategories] = useState([])
  const [pageData, setPageData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Local state for filters
  const [priceRange, setPriceRange] = useState([minPriceParam, maxPriceParam])
  const [minRating, setMinRating] = useState(minRatingParam)
  const [showMobileFilters, setShowMobileFilters] = useState(false)

  // Categories for the filter dropdown
  useEffect(() => {
    categoriesApi
      .list()
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch(() => setCategories([]))
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // Split sortBy into sortBy and sortDirection
      let apiSortBy = sortBy
      let apiSortDirection
      if (sortBy.includes(',')) {
        const parts = sortBy.split(',')
        apiSortBy = parts[0]
        apiSortDirection = parts[1]
      }

      const data = await productsApi.list({
        page,
        size: PAGE_SIZE,
        sortBy: apiSortBy,
        sortDirection: apiSortDirection,
        categoryId: categoryId || undefined,
        keyword: keyword || undefined,
        minPrice: minPriceParam > 0 ? minPriceParam : undefined,
        maxPrice: maxPriceParam < 100000 ? maxPriceParam : undefined,
        minRating: minRatingParam > 0 ? minRatingParam : undefined,
      })
      
      setPageData(normalizePage(data))
    } catch (err) {
      setError(err)
      setPageData(null)
    } finally {
      setLoading(false)
    }
  }, [page, sortBy, categoryId, keyword, minPriceParam, maxPriceParam, minRatingParam])

  useEffect(() => {
    load()
  }, [load])
  
  useEffect(() => {
    setPriceRange([minPriceParam, maxPriceParam])
    setMinRating(minRatingParam)
  }, [minPriceParam, maxPriceParam, minRatingParam])

  const patchParams = useCallback(
    (patch) => {
      const next = new URLSearchParams(searchParams)
      Object.entries(patch).forEach(([k, v]) => {
        if (v === '' || v === null || v === undefined) next.delete(k)
        else next.set(k, String(v))
      })
      if (!('page' in patch)) next.delete('page')
      setSearchParams(next)
    },
    [searchParams, setSearchParams],
  )

  const onCategoryChange = (id) => {
    patchParams({ categoryId: id, keyword: '' })
  }

  const onSortChange = (e) => patchParams({ sortBy: e.target.value })

  const clearAll = () => {
    setSearchParams(new URLSearchParams())
  }
  
  const applyFilters = () => {
    patchParams({
      minPrice: priceRange[0] > 0 ? priceRange[0] : null,
      maxPrice: priceRange[1] < 100000 ? priceRange[1] : null,
      minRating: minRating > 0 ? minRating : null
    })
    setShowMobileFilters(false)
  }

  const hasFilters = Boolean(keyword || categoryId || minPriceParam > 0 || maxPriceParam < 100000 || minRatingParam > 0)
  const products = pageData?.content ?? []
  
  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Products' }
  ]
  if (keyword) breadcrumbItems.push({ label: `Search: ${keyword}` })
  else if (categoryId && categories.length > 0) {
    const cat = categories.find(c => String(c.id) === String(categoryId))
    if (cat) breadcrumbItems.push({ label: cat.name })
  }

  return (
    <div className="flex flex-col md:flex-row gap-6">
      
      {/* Mobile Filters Button */}
      <div className="md:hidden flex justify-between items-center bg-white p-3 rounded-lg shadow-sm border border-slate-200">
        <span className="font-medium text-slate-700">Filters & Sort</span>
        <button 
          onClick={() => setShowMobileFilters(!showMobileFilters)}
          className="bg-slate-100 p-2 rounded hover:bg-slate-200"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path></svg>
        </button>
      </div>

      {/* Left Sidebar */}
      <div className={`w-full md:w-64 shrink-0 flex-col gap-6 ${showMobileFilters ? 'flex' : 'hidden md:flex'}`}>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 sticky top-20">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-4">
            <h2 className="text-lg font-bold text-slate-900">Filters</h2>
            {hasFilters && (
              <button onClick={clearAll} className="text-xs font-medium text-brand-600 hover:text-brand-700">
                Clear All
              </button>
            )}
          </div>
          
          <div className="space-y-6">
            {/* Price Filter */}
            <div>
              <h3 className="text-sm font-semibold text-slate-800 mb-3 uppercase tracking-wider">Price</h3>
              <PriceRangeSlider 
                min={0} 
                max={100000} 
                value={priceRange} 
                onChange={setPriceRange} 
              />
            </div>
            
            <div className="border-t border-slate-100 pt-4"></div>
            
            {/* Rating Filter */}
            <div>
              <h3 className="text-sm font-semibold text-slate-800 mb-3 uppercase tracking-wider">Customer Rating</h3>
              <div className="space-y-2 text-sm text-slate-700">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="rating" checked={minRating === 4} onChange={() => setMinRating(4)} className="text-brand-600" />
                  <span>4★ & above</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="rating" checked={minRating === 3} onChange={() => setMinRating(3)} className="text-brand-600" />
                  <span>3★ & above</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="rating" checked={minRating === 2} onChange={() => setMinRating(2)} className="text-brand-600" />
                  <span>2★ & above</span>
                </label>
                {minRating > 0 && (
                  <button onClick={() => setMinRating(0)} className="text-xs text-slate-500 hover:text-slate-700">Clear rating</button>
                )}
              </div>
            </div>
            
            <div className="border-t border-slate-100 pt-4"></div>
            
            {/* Category Filter */}
            <div>
              <h3 className="text-sm font-semibold text-slate-800 mb-3 uppercase tracking-wider">Category</h3>
              <div className="space-y-2 text-sm text-slate-700 max-h-48 overflow-y-auto">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="category" checked={!categoryId} onChange={() => onCategoryChange('')} className="text-brand-600" />
                  <span>All Categories</span>
                </label>
                {categories.map(c => (
                  <label key={c.id} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="category" checked={String(categoryId) === String(c.id)} onChange={() => onCategoryChange(c.id)} className="text-brand-600" />
                    <span>{c.name}</span>
                  </label>
                ))}
              </div>
            </div>
            
            {/* Apply filters button */}
            <Button fullWidth onClick={applyFilters}>Apply Filters</Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        <Breadcrumb items={breadcrumbItems} />
        
        <div className="mb-4 bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-sm text-slate-600 font-medium">
            {keyword ? (
              <span>Showing results for "<span className="text-slate-900">{keyword}</span>"</span>
            ) : (
              <span>Showing {pageData ? products.length : 0} of {pageData?.totalElements || 0} results</span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-500 whitespace-nowrap">Sort by:</label>
            <select 
              className="text-sm border-slate-200 rounded-md focus:border-brand-500 focus:ring-brand-500 bg-slate-50"
              value={sortBy}
              onChange={onSortChange}
            >
              {SORT_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : error ? (
          <ErrorMessage error={error} onRetry={load} />
        ) : products.length === 0 ? (
          <EmptyState
            title="No products found"
            message={
              hasFilters
                ? 'Try a different search term or clear the filters to see more results.'
                : 'There are no products in the catalog yet.'
            }
            action={
              hasFilters ? (
                <Button variant="outline" onClick={clearAll}>
                  Clear all filters
                </Button>
              ) : null
            }
          />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>

            <div className="mt-8 flex justify-center">
              <Pagination
                page={pageData.number}
                totalPages={pageData.totalPages}
                onChange={(p) => patchParams({ page: p })}
              />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
