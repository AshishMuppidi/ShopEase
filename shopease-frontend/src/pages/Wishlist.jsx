import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useWishlist } from '../context/WishlistContext'
import { useCart } from '../context/CartContext'
import { formatPrice } from '../lib/format'
import { getErrorMessage } from '../lib/errors'
import { Button, Card, Badge, LoadingSpinner, EmptyState, ErrorMessage } from '../components/ui'
import { buttonClasses } from '../components/ui/Button'

function HeartIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...props}>
      <path
        d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 1 0-7.8 7.8l1.1 1L12 21l7.7-7.6 1.1-1a5.5 5.5 0 0 0 0-7.8z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function summarizeAttributes(attributes) {
  if (!attributes) return null
  try {
    const parsed = JSON.parse(attributes)
    if (parsed && typeof parsed === 'object') {
      return Object.entries(parsed)
        .map(([k, v]) => `${k}: ${v}`)
        .join(' · ')
    }
  } catch {
    /* fall through */
  }
  return attributes
}

export default function Wishlist() {
  const { items, loading, error, refresh, removeItem } = useWishlist()
  const { addItem: addToCart } = useCart()

  const [busyId, setBusyId] = useState(null)
  const [actionError, setActionError] = useState(null)
  const [notice, setNotice] = useState(null)

  const moveToCart = async (item) => {
    setBusyId(item.variantId)
    setActionError(null)
    setNotice(null)
    try {
      await addToCart(item.variantId, 1)
      await removeItem(item.variantId)
      setNotice(`Moved “${item.productName}” to your cart.`)
    } catch (err) {
      setActionError(getErrorMessage(err))
    } finally {
      setBusyId(null)
    }
  }

  const remove = async (variantId) => {
    setBusyId(variantId)
    setActionError(null)
    try {
      await removeItem(variantId)
    } catch (err) {
      setActionError(getErrorMessage(err))
    } finally {
      setBusyId(null)
    }
  }

  if (loading && items.length === 0) return <LoadingSpinner fullPage size="lg" />

  if (error && items.length === 0) {
    return (
      <div className="py-6">
        <h1 className="mb-4 text-2xl font-bold text-slate-900">Your wishlist</h1>
        <ErrorMessage error={error} onRetry={refresh} />
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="py-6">
        <h1 className="mb-6 text-2xl font-bold text-slate-900">Your wishlist</h1>
        <EmptyState
          icon={<HeartIcon className="h-6 w-6" />}
          title="No saved items yet"
          message="Tap the heart on any product to save it here for later."
          action={
            <Link to="/products" className={buttonClasses({ variant: 'primary' })}>
              Explore products
            </Link>
          }
        />
      </div>
    )
  }

  return (
    <div className="py-6">
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Your wishlist</h1>

      {actionError && <ErrorMessage message={actionError} className="mb-4" />}
      {notice && (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-800">
          {notice}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((item) => {
          const attrs = summarizeAttributes(item.attributes)
          const busy = busyId === item.variantId
          return (
            <Card key={item.variantId} className="flex gap-4">
              <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                <HeartIcon className="h-6 w-6" />
              </div>
              <div className="flex min-w-0 flex-1 flex-col">
                <p className="truncate font-medium text-slate-800">{item.productName}</p>
                <p className="text-xs text-slate-500">SKU: {item.sku}</p>
                {attrs && <p className="mt-0.5 truncate text-xs text-slate-500">{attrs}</p>}
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-900">
                    {formatPrice(item.price)}
                  </span>
                  {item.inStock ? (
                    <Badge tone="success">In stock</Badge>
                  ) : (
                    <Badge tone="danger">Out of stock</Badge>
                  )}
                </div>

                <div className="mt-3 flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1 bg-[#fb641b] hover:bg-[#f05c14] border-none text-white font-semibold"
                    onClick={() => moveToCart(item)}
                    loading={busy}
                    disabled={!item.inStock}
                  >
                    MOVE TO CART
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-slate-300 text-slate-500 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50"
                    onClick={() => remove(item.variantId)}
                    disabled={busy}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
