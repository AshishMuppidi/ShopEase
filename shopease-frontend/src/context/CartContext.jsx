import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'
import { cartApi } from '../api/cart'
import { useAuth } from './AuthContext'

const CartContext = createContext(null)

/**
 * Server-authoritative cart. Every mutation endpoint returns the full updated
 * CartResponse, so we just store what the backend sends — the frontend never
 * recomputes totals. Cart loads when authenticated and clears on logout.
 */
export function CartProvider({ children }) {
  const { isAuthenticated } = useAuth()
  const [cart, setCart] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await cartApi.get()
      setCart(data)
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
      setCart(null)
    }
  }, [isAuthenticated, refresh])

  const addItem = useCallback(async (variantId, quantity = 1) => {
    const data = await cartApi.addItem(variantId, quantity)
    setCart(data)
    return data
  }, [])

  const updateItem = useCallback(async (variantId, quantity) => {
    const data = await cartApi.updateItem(variantId, quantity)
    setCart(data)
    return data
  }, [])

  const removeItem = useCallback(async (variantId) => {
    const data = await cartApi.removeItem(variantId)
    setCart(data)
    return data
  }, [])

  const clear = useCallback(async () => {
    const data = await cartApi.clear()
    setCart(data)
    return data
  }, [])

  const items = cart?.items ?? []
  const itemCount = items.reduce((sum, it) => sum + (it.quantity || 0), 0)

  const value = {
    cart,
    items,
    itemCount,
    totalPrice: cart?.totalPrice ?? 0,
    loading,
    error,
    refresh,
    addItem,
    updateItem,
    removeItem,
    clear,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within a CartProvider')
  return ctx
}
