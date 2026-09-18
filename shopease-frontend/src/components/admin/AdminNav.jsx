import { NavLink } from 'react-router-dom'

const TABS = [
  { to: '/admin', label: 'Dashboard', exact: true },
  { to: '/admin/categories', label: 'Categories' },
  { to: '/admin/products', label: 'Products' },
  { to: '/admin/orders', label: 'Orders' },
]

/**
 * Shared admin section header + tab navigation. `activeKey` lets nested pages
 * (variants, order details) highlight their parent tab.
 */
export default function AdminNav({ activeKey }) {
  return (
    <div className="mb-6 border-b border-slate-200">
      <div className="mb-3 flex items-center gap-2">
        <span className="rounded-md bg-brand-100 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-brand-700">
          Admin
        </span>
        <h1 className="text-xl font-bold text-slate-900">Store Management</h1>
      </div>
      <nav className="-mb-px flex gap-6 overflow-x-auto">
        {TABS.map((tab) => {
          const forcedActive =
            (activeKey === 'dashboard' && tab.label === 'Dashboard') ||
            (activeKey === 'products' && tab.label === 'Products') ||
            (activeKey === 'orders' && tab.label === 'Orders') ||
            (activeKey === 'categories' && tab.label === 'Categories')
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.exact}
              className={({ isActive }) =>
                `whitespace-nowrap border-b-2 pb-3 text-sm font-medium transition-colors ${
                  isActive || forcedActive
                    ? 'border-brand-600 text-brand-700'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`
              }
            >
              {tab.label}
            </NavLink>
          )
        })}
      </nav>
    </div>
  )
}
