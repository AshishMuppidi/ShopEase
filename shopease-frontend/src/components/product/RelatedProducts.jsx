import { useState, useEffect } from 'react'
import { recommendationsApi } from '../../api/recommendations'
import ProductCard from './ProductCard'

export default function RelatedProducts({ productId }) {
  const [products, setProducts] = useState([])
  
  useEffect(() => {
    if (!productId) return
    recommendationsApi.related(productId)
      .then(data => setProducts(Array.isArray(data) ? data : []))
      .catch(() => {})
  }, [productId])
  
  if (products.length === 0) return null

  return (
    <section className="mt-12 pt-8 border-t border-slate-200">
      <h2 className="text-xl font-bold text-slate-900 mb-6">Similar Products</h2>
      <div className="flex gap-4 overflow-x-auto snap-x pb-4">
        {products.map(p => (
          <div key={p.id} className="w-48 lg:w-56 shrink-0 snap-start">
            <ProductCard product={p} />
          </div>
        ))}
      </div>
    </section>
  )
}
