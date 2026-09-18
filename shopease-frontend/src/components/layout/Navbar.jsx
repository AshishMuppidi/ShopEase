import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import { useWishlist } from '../../context/WishlistContext'
import MegaMenu from './MegaMenu'
import { categoriesApi } from '../../api/categories'

function BagIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" strokeLinejoin="round" />
      <path d="M3 6h18M16 10a4 4 0 0 1-8 0" strokeLinecap="round" />
    </svg>
  )
}

function HeartIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path
        d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 1 0-7.8 7.8l1.1 1L12 21l7.7-7.6 1.1-1a5.5 5.5 0 0 0 0-7.8z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function SearchIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" strokeLinecap="round" />
    </svg>
  )
}

function CountBubble({ count }) {
  if (!count) return null
  return (
    <span className="absolute -right-2 -top-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-yellow-400 px-1.5 text-[11px] font-bold leading-none text-brand-900 border-2 border-brand-600">
      {count > 99 ? '99+' : count}
    </span>
  )
}

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth()
  const { itemCount: cartCount } = useCart()
  const { itemCount: wishCount } = useWishlist()
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showMegaMenu, setShowMegaMenu] = useState(false)
  const [categories, setCategories] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    categoriesApi.list().then(data => {
      setCategories(Array.isArray(data) ? data : [])
    }).catch(() => {})
  }, [])

  const close = () => setMenuOpen(false)

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate('/products?keyword=' + encodeURIComponent(searchQuery.trim()))
    }
  }

  const firstName = user?.name?.split(' ')[0] || 'User'

  return (
    <header className="sticky top-0 z-40 bg-brand-600 shadow-sm relative">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        
        {/* Logo */}
        <Link to="/" onClick={close} className="flex items-center gap-2 mr-2">
          <span className="flex h-8 w-8 items-center justify-center text-white">
            <BagIcon className="h-6 w-6" />
          </span>
          <span className="text-xl font-bold tracking-tight text-white italic">
            ShopEase
          </span>
        </Link>

        {/* Desktop Categories Link with MegaMenu */}
        <div 
          className="hidden md:block relative h-full flex items-center"
          onMouseEnter={() => setShowMegaMenu(true)}
          onMouseLeave={() => setShowMegaMenu(false)}
        >
          <button className="flex items-center gap-1 text-white font-medium hover:text-yellow-400 h-full px-2 transition-colors">
            Categories
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
          </button>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="hidden md:flex flex-1 max-w-2xl mx-auto h-9">
          <input
            type="search"
            placeholder="Search for products, brands and more"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-l-sm border-none bg-white px-4 text-sm text-slate-900 focus:outline-none placeholder:text-slate-500"
          />
          <button type="submit" className="flex items-center justify-center rounded-r-sm bg-yellow-400 hover:bg-yellow-500 px-4 transition-colors">
            <SearchIcon className="h-5 w-5 text-brand-900" />
          </button>
        </form>

        {/* Right Nav */}
        <div className="ml-auto flex items-center gap-4 md:gap-6 text-white">
          
          {/* Account Dropdown */}
          <div className="hidden md:block group relative h-14 flex items-center">
            {isAuthenticated ? (
              <button className="flex items-center gap-1 font-medium hover:text-yellow-400 h-full transition-colors">
                {firstName}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </button>
            ) : (
              <Link to="/login" className="flex items-center gap-1 font-medium hover:text-yellow-400 h-full transition-colors">
                Login
              </Link>
            )}
            
            {/* Dropdown Content */}
            {isAuthenticated && (
              <div className="absolute right-0 top-full hidden w-48 rounded-sm bg-white py-2 shadow-xl group-hover:block border border-slate-100">
                <div className="absolute -top-2 right-4 h-4 w-4 rotate-45 bg-white border-l border-t border-slate-100"></div>
                {user?.role === 'ADMIN' && (
                  <Link
                    to="/admin"
                    className="block px-4 py-2 text-sm font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 transition-colors"
                  >
                    ⚡ Admin Panel
                  </Link>
                )}
                <Link to="/profile" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-brand-600 transition-colors">My Profile</Link>
                <Link to="/orders" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-brand-600 transition-colors">Orders</Link>
                <Link to="/wishlist" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-brand-600 transition-colors">Wishlist</Link>
                <div className="my-1 border-t border-slate-100"></div>
                <button onClick={() => logout()} className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-brand-600 transition-colors">Logout</button>
              </div>
            )}
          </div>

          <Link to="/wishlist" className="hidden md:flex relative items-center gap-2 font-medium hover:text-yellow-400 transition-colors">
            <div className="relative">
              <HeartIcon className="h-5 w-5" />
              {isAuthenticated && <CountBubble count={wishCount} />}
            </div>
          </Link>

          <Link to="/cart" className="flex relative items-center gap-2 font-medium hover:text-yellow-400 transition-colors">
            <div className="relative">
              <BagIcon className="h-5 w-5" />
              <CountBubble count={cartCount} />
            </div>
            <span className="hidden md:inline">Cart</span>
          </Link>

          {/* Mobile menu toggle */}
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="md:hidden text-white hover:text-yellow-400"
          >
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {menuOpen ? (
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* MegaMenu for desktop */}
      <MegaMenu 
        isOpen={showMegaMenu} 
        onMouseEnter={() => setShowMegaMenu(true)}
        onMouseLeave={() => setShowMegaMenu(false)}
        categories={categories}
      />

      {/* Mobile Search Bar (shows below header if not open menu) */}
      <div className="md:hidden bg-brand-700 p-2">
        <form onSubmit={handleSearchSubmit} className="flex h-9">
          <input
            type="search"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-l-sm border-none bg-white px-3 text-sm focus:outline-none"
          />
          <button type="submit" className="flex items-center justify-center rounded-r-sm bg-yellow-400 px-3">
            <SearchIcon className="h-4 w-4 text-brand-900" />
          </button>
        </form>
      </div>

      {/* Mobile Sidebar panel */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={close}></div>
          <div className="relative w-4/5 max-w-sm bg-white h-full overflow-y-auto flex flex-col">
            <div className="bg-brand-600 p-4 text-white flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-white text-brand-600 flex items-center justify-center font-bold text-lg">
                {isAuthenticated ? firstName[0].toUpperCase() : 'U'}
              </div>
              <div>
                <div className="text-sm opacity-80">Welcome,</div>
                <div className="font-semibold text-lg">{isAuthenticated ? user.name : 'Guest'}</div>
              </div>
            </div>
            
            <div className="flex-1 py-2">
              <Link to="/products" onClick={close} className="block px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50">Shop All Products</Link>
              <Link to="/deals" onClick={close} className="block px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50">Today's Deals</Link>
              
              <div className="my-2 border-t border-slate-100"></div>
              <div className="px-4 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">My Account</div>
              
              {isAuthenticated ? (
                <>
                  {user?.role === 'ADMIN' && (
                    <Link
                      to="/admin"
                      onClick={close}
                      className="block px-4 py-3 text-sm font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100"
                    >
                      ⚡ Admin Dashboard
                    </Link>
                  )}
                  <Link to="/profile" onClick={close} className="block px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50">Profile</Link>
                  <Link to="/orders" onClick={close} className="block px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50">My Orders</Link>
                  <Link to="/wishlist" onClick={close} className="block px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50">My Wishlist</Link>
                  <div className="my-2 border-t border-slate-100"></div>
                  <button onClick={() => { close(); logout(); }} className="block w-full text-left px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50">Sign Out</button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={close} className="block px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50">Sign In</Link>
                  <Link to="/register" onClick={close} className="block px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50">Create Account</Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
