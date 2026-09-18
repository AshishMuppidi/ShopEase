import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { formatPrice } from '../lib/format'
import { getErrorMessage } from '../lib/errors'
import { Button, Card, LoadingSpinner, EmptyState, ErrorMessage } from '../components/ui'
import { buttonClasses } from '../components/ui/Button'

function BagIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...props}>
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" strokeLinejoin="round" />
      <path d="M3 6h18M16 10a4 4 0 0 1-8 0" strokeLinecap="round" />
    </svg>
  )
}

// Attributes may be JSON or a plain string; keep it compact for the list row.
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

export default function Cart() {
  const { items, totalPrice, loading, error, refresh, updateItem, removeItem, clear } =
    useCart()
  const navigate = useNavigate()

  const [busyId, setBusyId] = useState(null)
  const [clearing, setClearing] = useState(false)
  const [actionError, setActionError] = useState(null)

  const changeQty = async (variantId, nextQty) => {
    if (nextQty < 1) return
    setBusyId(variantId)
    setActionError(null)
    try {
      await updateItem(variantId, nextQty)
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

  const clearCart = async () => {
    setClearing(true)
    setActionError(null)
    try {
      await clear()
    } catch (err) {
      setActionError(getErrorMessage(err))
    } finally {
      setClearing(false)
    }
  }

  if (loading && items.length === 0) return <LoadingSpinner fullPage size="lg" />

  if (error && items.length === 0) {
    return (
      <div className="py-6">
        <h1 className="mb-4 text-2xl font-bold text-slate-900">Your cart</h1>
        <ErrorMessage error={error} onRetry={refresh} />
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="py-6">
        <h1 className="mb-6 text-2xl font-bold text-slate-900">Your cart</h1>
        <EmptyState
          icon={<BagIcon className="h-6 w-6" />}
          title="Your cart is empty"
          message="Browse the catalog and add items you’d like to buy."
          action={
            <Link to="/products" className={buttonClasses({ variant: 'primary' })}>
              Start shopping
            </Link>
          }
        />
      </div>
    )
  }

  return (
    <div className="py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Your cart</h1>
        <button
          type="button"
          onClick={clearCart}
          disabled={clearing}
          className="text-sm font-medium text-slate-500 hover:text-rose-600 disabled:opacity-50"
        >
          {clearing ? 'Clearing…' : 'Clear cart'}
        </button>
      </div>

      {actionError && <ErrorMessage message={actionError} className="mb-4" />}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Line items */}
        <div className="space-y-3 lg:col-span-2">
          {items.map((item) => {
            const attrs = summarizeAttributes(item.attributes)
            const busy = busyId === item.variantId
            return (
              <Card key={item.variantId} className="flex gap-4" padded>
                <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                  <BagIcon className="h-6 w-6" />
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-800">
                        {item.productName}
                      </p>
                      <p className="text-xs text-slate-500">SKU: {item.sku}</p>
                      {attrs && (
                        <p className="mt-0.5 truncate text-xs text-slate-500">{attrs}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => remove(item.variantId)}
                      disabled={busy}
                      className="text-xs font-medium text-slate-400 hover:text-rose-600 disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <div className="inline-flex items-center rounded-lg border border-slate-300">
                      <button
                        type="button"
                        className="px-2.5 py-1 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                        onClick={() => changeQty(item.variantId, item.quantity - 1)}
                        disabled={busy || item.quantity <= 1}
                        aria-label="Decrease quantity"
                      >
                        −
                      </button>
                      <span className="w-9 text-center text-sm font-medium">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        className="px-2.5 py-1 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                        onClick={() => changeQty(item.variantId, item.quantity + 1)}
                        disabled={busy}
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-900">
                        {formatPrice(item.subTotal)}
                      </p>
                      <p className="text-xs text-slate-400">
                        {formatPrice(item.unitPrice)} each
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-20 shadow-sm border border-slate-200">
            <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-2">Price Details</h2>
            <div className="border-t border-slate-100 pt-4 space-y-3">
              <div className="flex justify-between text-sm text-slate-600">
                <span>Price ({items.length} items)</span>
                <span>{formatPrice(totalPrice)}</span>
              </div>
              <div className="flex justify-between text-sm text-green-600">
                <span>Discount</span>
                <span>− {formatPrice(0)}</span>
              </div>
              <div className="flex justify-between text-sm text-slate-600">
                <span>Delivery Charges</span>
                <span className="text-green-600">Free</span>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-4 border-b pb-4 mb-4">
              <span className="text-base font-bold text-slate-900">Total Amount</span>
              <span className="text-xl font-bold text-slate-900">
                {formatPrice(totalPrice)}
              </span>
            </div>
            <div className="text-xs text-green-600 font-medium mb-5">
              You will save {formatPrice(0)} on this order
            </div>
            <Button
              fullWidth
              size="lg"
              className="mt-2 bg-[#fb641b] hover:bg-[#f05c14] border-none text-white font-semibold"
              onClick={() => navigate('/checkout')}
            >
              PLACE ORDER
            </Button>
            <Link
              to="/products"
              className="mt-3 block text-center text-sm font-medium text-brand-600 hover:text-brand-700"
            >
              Continue shopping
            </Link>
          </Card>
        </div>
      </div>
    </div>
  )
}
