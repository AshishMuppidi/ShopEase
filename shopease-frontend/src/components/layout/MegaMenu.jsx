import { Link } from 'react-router-dom'

export default function MegaMenu({ isOpen, onMouseEnter, onMouseLeave, categories = [] }) {
  if (!isOpen) return null

  return (
    <div 
      className="absolute left-0 top-full z-50 w-full border-b border-slate-200 bg-white shadow-lg"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="mx-auto max-w-7xl flex h-96">
        {/* Left side categories list */}
        <div className="w-64 border-r border-slate-200 bg-slate-50 py-4 overflow-y-auto">
          <ul className="space-y-1">
            {categories.map(c => (
              <li key={c.id}>
                <Link 
                  to={`/products?categoryId=${c.id}`} 
                  className="block px-6 py-2 text-sm font-medium text-slate-700 hover:bg-white hover:text-brand-600 transition-colors"
                >
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        {/* Right side content (placeholder for subcategories) */}
        <div className="flex-1 p-8 bg-white">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Popular Categories</h3>
          <div className="grid grid-cols-3 gap-6">
            {categories.slice(0, 9).map(c => (
              <Link key={c.id} to={`/products?categoryId=${c.id}`} className="text-sm text-slate-600 hover:text-brand-600 hover:underline">
                {c.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
