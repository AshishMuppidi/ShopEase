import { Link } from 'react-router-dom'

export default function TopBar() {
  return (
    <div className="bg-brand-700 py-1 px-4 text-[11px] font-medium text-white sm:text-xs">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <div className="flex items-center gap-4">
          <span>ShopEase</span>
        </div>
        <div className="flex items-center gap-4">
          <a href="#" className="hover:underline">Become a Seller</a>
          <a href="#" className="hover:underline">Download App</a>
        </div>
      </div>
    </div>
  )
}
