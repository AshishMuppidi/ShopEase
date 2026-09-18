import { Link } from 'react-router-dom'

export default function Breadcrumb({ items }) {
  return (
    <nav className="flex items-center text-sm text-slate-500 mb-4 whitespace-nowrap overflow-x-auto">
      {items.map((item, index) => (
        <span key={index} className="flex items-center">
          {index > 0 && <span className="mx-2 text-slate-300">/</span>}
          {item.href ? (
            <Link to={item.href} className="hover:text-slate-800 transition-colors">
              {item.label}
            </Link>
          ) : (
            <span className="text-slate-800 font-medium">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  )
}
