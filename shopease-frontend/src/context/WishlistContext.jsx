import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'
import { wishlistApi } from '../api/wishlist'
import { useAuth } from './AuthContext'

const WishlistContext = createContext(null)

/**
 * Wishlist mirrors the cart pattern: mutations return the full updated
 * WishlistResponse. Items are keyed by variantId (no quantity concept).
 */
export function WishlistProvider({ children }) {
  const { isAuthenticated } = useAuth()
  const [wishlist, setWishlist] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await wishlistApi.get()
      setWishlist(data)
      return data
    } catch (e) {
      setError(e)
      throw e
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      refresh().catch(() => {})
    } else {
      setWishlist(null)
    }
  }, [isAuthenticated, refresh])

  const addItem = useCallback(async (variantId) => {
    const data = await wishlistApi.addItem(variantId)
    setWishlist(data)
    return data
  }, [])

  const removeItem = useCallback(async (variantId) => {
    const data = await wishlistApi.removeItem(variantId)
    setWishlist(data)
    return data
  }, [])

  const items = wishlist?.items ?? []
  const itemCount = items.length

  const isWishlisted = useCallback(
    (variantId) => items.some((it) => it.variantId === variantId),
    [items],
  )

  const value = {
    wishlist,
    items,
    itemCount,
    loading,
    error,
    refresh,
    addItem,
    removeItem,
    isWishlisted,
  }

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  )
}

export function useWishlist() {
  const ctx = useContext(WishlistContext)
  if (!ctx) throw new Error('useWishlist must be used within a WishlistProvider')
  return ctx
}
