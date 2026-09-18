import { Link } from 'react-router-dom'

const categoryIcons = {
  1: '📱', 2: '💻', 3: '👕', 4: '👟', 5: '🍔', 6: '📚',
}

export default function CategoryTiles({ categories }) {
  if (!categories || categories.length === 0) return null

  return (
    <section className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-slate-100">
      <div className="grid grid-cols-4 md:grid-cols-8 gap-4 sm:gap-6">
        {categories.slice(0, 8).map(c => (
          <Link key={c.id} to={`/products?categoryId=${c.id}`} className="group flex flex-col items-center gap-2 sm:gap-3">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-brand-50 flex items-center justify-center text-2xl sm:text-3xl group-hover:scale-110 group-hover:shadow-md transition-all duration-300">
              {categoryIcons[c.id] || '🛒'}
            </div>
            <span className="text-[11px] sm:text-xs font-medium text-slate-700 text-center group-hover:text-brand-600 transition-colors">
              {c.name}
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}
