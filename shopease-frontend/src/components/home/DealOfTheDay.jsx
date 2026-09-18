import { Link } from 'react-router-dom'
import { CountdownTimer } from '../ui'
import ProductCard from '../product/ProductCard'

export default function DealOfTheDay({ products, targetDate }) {
  if (!products || products.length === 0) return null

  return (
    <section className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="border-b border-slate-100 p-4 sm:px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-slate-900">Deal of the Day</h2>
          <div className="hidden sm:flex items-center gap-2">
            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <CountdownTimer targetDate={targetDate} />
          </div>
        </div>
        <Link to="/products" className="bg-brand-600 text-white px-4 py-1.5 rounded-sm text-sm font-medium hover:bg-brand-700 transition-colors shadow-sm">
          VIEW ALL
        </Link>
      </div>
      <div className="p-4 sm:p-6 flex gap-4 overflow-x-auto snap-x pb-6">
        {products.map(p => (
          <div key={p.id} className="w-40 sm:w-48 lg:w-56 shrink-0 snap-start">
            <ProductCard product={p} />
          </div>
        ))}
      </div>
    </section>
  )
}
