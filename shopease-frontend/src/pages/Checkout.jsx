import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ordersApi } from '../api/orders'
import { paymentApi } from '../api/payment'
import { profileApi } from '../api/profile'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { formatPrice } from '../lib/format'
import { getErrorMessage } from '../lib/errors'
import { Button, Input, Card, LoadingSpinner, EmptyState, ErrorMessage } from '../components/ui'
import { buttonClasses } from '../components/ui/Button'
import OrderItemsList from '../components/order/OrderItemsList'

function BagIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...props}>
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" strokeLinejoin="round" />
      <path d="M3 6h18M16 10a4 4 0 0 1-8 0" strokeLinecap="round" />
    </svg>
  )
}

// Mirrors the backend AddressRequest — every field is @NotBlank.
const ADDRESS_FIELDS = [
  { key: 'fullName', label: 'Full name', autoComplete: 'name', placeholder: 'Jane Doe', full: true },
  { key: 'phone', label: 'Phone', autoComplete: 'tel', placeholder: '+1 555 010 1234' },
  { key: 'street', label: 'Street address', autoComplete: 'street-address', placeholder: '123 Market St', full: true },
  { key: 'city', label: 'City', autoComplete: 'address-level2', placeholder: 'San Francisco' },
  { key: 'state', label: 'State / Province', autoComplete: 'address-level1', placeholder: 'CA' },
  { key: 'zipCode', label: 'ZIP / Postal code', autoComplete: 'postal-code', placeholder: '94103' },
  { key: 'country', label: 'Country', autoComplete: 'country-name', placeholder: 'United States' },
]

const EMPTY_ADDRESS = ADDRESS_FIELDS.reduce((acc, f) => ({ ...acc, [f.key]: '' }), {})

function Stepper({ step }) {
  const steps = [
    { key: 'address', label: 'Shipping' },
    { key: 'payment', label: 'Payment' },
  ]
  const activeIndex = step === 'address' ? 0 : 1
  return (
    <ol className="mb-6 flex items-center gap-3 text-sm">
      {steps.map((s, i) => {
        const active = i === activeIndex
        const done = i < activeIndex
        return (
          <li key={s.key} className="flex items-center gap-3">
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                active
                  ? 'bg-brand-600 text-white'
                  : done
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-200 text-slate-500'
              }`}
            >
              {done ? '✓' : i + 1}
            </span>
            <span className={active ? 'font-medium text-slate-900' : 'text-slate-500'}>
              {s.label}
            </span>
            {i < steps.length - 1 && <span className="h-px w-8 bg-slate-200" />}
          </li>
        )
      })}
    </ol>
  )
}

export default function Checkout() {
  const navigate = useNavigate()
  const { items, totalPrice, loading: cartLoading, refresh: refreshCart } = useCart()
  const { isAuthenticated } = useAuth()

  const [step, setStep] = useState('address') // 'address' | 'payment' | 'failed'
  
  const [savedAddresses, setSavedAddresses] = useState([])
  const [loadingAddresses, setLoadingAddresses] = useState(false)
  const [selectedAddressId, setSelectedAddressId] = useState(null)
  const [useManualAddress, setUseManualAddress] = useState(false)

  const [form, setForm] = useState(EMPTY_ADDRESS)
  const [fieldErrors, setFieldErrors] = useState({})
  const [error, setError] = useState(null)

 const [order, setOrder] = useState(null)
const [idempotencyKey, setIdempotencyKey] = useState(null)
const [intentReady, setIntentReady] = useState(false)
const [paymentSetupError, setPaymentSetupError] = useState(null)

  const [submitting, setSubmitting] = useState(false)
  const [paying, setPaying] = useState(false)

  useEffect(() => {
    if (isAuthenticated) {
      loadAddresses()
    } else {
      setUseManualAddress(true)
    }
  }, [isAuthenticated])

  const loadAddresses = async () => {
    setLoadingAddresses(true)
    try {
      const res = await profileApi.getAddresses()
      setSavedAddresses(res || [])
      if (res && res.length > 0) {
        const def = res.find(a => a.isDefault)
        setSelectedAddressId(def ? def.id : res[0].id)
        setUseManualAddress(false)
      } else {
        setUseManualAddress(true)
      }
    } catch (err) {
      console.error(err)
      setUseManualAddress(true)
    } finally {
      setLoadingAddresses(false)
    }
  }

  const setField = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const validate = () => {
    if (!useManualAddress && selectedAddressId) return true
    
    const errs = {}
    ADDRESS_FIELDS.forEach((f) => {
      if (!form[f.key].trim()) errs[f.key] = `${f.label} is required.`
    })
    setFieldErrors(errs)
    return Object.keys(errs).length === 0
  }

  const setupIntent = async (orderId) => {
  setPaymentSetupError(null)

  try {
    const key = idempotencyKey || crypto.randomUUID()

    if (!idempotencyKey) {
      setIdempotencyKey(key)
    }

    await paymentApi.createIntent(orderId, key)
    setIntentReady(true)
  } catch (err) {
    setIntentReady(false)
    setPaymentSetupError(getErrorMessage(err))
  }
}

  const placeOrder = async (e) => {
    e.preventDefault()
    setError(null)
    if (!validate()) return
    setSubmitting(true)
    try {
      const payload = useManualAddress 
        ? { shippingAddress: { ...form } } 
        : { savedAddressId: selectedAddressId }

      const created = await ordersApi.checkout(payload)
      setOrder(created)
      setStep('payment')
      refreshCart?.().catch(() => {})
      await setupIntent(created.id)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  const completePayment = async () => {
    if (!order) return
    setPaying(true)
    setError(null)
    try {
      await paymentApi.confirm(order.id, 'SUCCESS')
      navigate(`/order-success/${order.id}`, { replace: true })
    } catch (err) {
      setError(getErrorMessage(err))
      setPaying(false)
    }
  }

  const failPayment = async () => {
    if (!order) return
    setPaying(true)
    setError(null)
    try {
      await paymentApi.confirm(order.id, 'FAILURE')
      setStep('failed')
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setPaying(false)
    }
  }

  if (step === 'address' && cartLoading && items.length === 0) {
    return <LoadingSpinner fullPage size="lg" />
  }

  if (step === 'address' && items.length === 0) {
    return (
      <div className="py-6">
        <h1 className="mb-6 text-2xl font-bold text-slate-900">Checkout</h1>
        <EmptyState
          icon={<BagIcon className="h-6 w-6" />}
          title="Your cart is empty"
          message="Add a few items to your cart before checking out."
          action={
            <Link to="/products" className={buttonClasses({ variant: 'primary' })}>
              Browse products
            </Link>
          }
        />
      </div>
    )
  }

  // ---- Failed payment ----
  if (step === 'failed') {
    return (
      <div className="mx-auto max-w-lg py-10 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-100 text-rose-600">
          <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="9" />
            <path d="M15 9l-6 6M9 9l6 6" strokeLinecap="round" />
          </svg>
        </div>
        <h1 className="mt-5 text-2xl font-bold text-slate-900">Payment failed</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          The simulated payment for order{' '}
          <span className="font-semibold text-slate-800">#{order?.id}</span> did not go
          through. The order was marked as failed and the reserved items were returned to
          stock. Your cart is empty — you can start a new order any time.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link to="/products" className={buttonClasses({ variant: 'primary' })}>
            Back to shopping
          </Link>
          <Link to="/orders" className={buttonClasses({ variant: 'outline' })}>
            View my orders
          </Link>
        </div>
      </div>
    )
  }

  // ---- Payment step ----
  if (step === 'payment' && order) {
    return (
      <div className="py-6">
        <h1 className="mb-1 text-2xl font-bold text-slate-900">Checkout</h1>
        <Stepper step="payment" />

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card>
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-brand-700">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <rect x="2" y="5" width="20" height="14" rx="2" />
                    <path d="M2 10h20" />
                  </svg>
                </span>
                <div>
                  <h2 className="text-sm font-semibold text-slate-800">Simulated payment</h2>
                  <p className="text-xs text-slate-500">
                    Order #{order.id} · No real card is charged
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                This is a simulated payment gateway. Choose an outcome below to see how the
                order responds — the server records the result and updates inventory
                accordingly.
              </div>

              {error && <ErrorMessage message={error} className="mt-4" />}
              
              <div className="mt-6 border border-slate-200 rounded-lg overflow-hidden bg-white">
                <div className="bg-slate-50 p-4 border-b border-slate-200">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="radio" name="payment_method" defaultChecked className="text-brand-600 h-4 w-4" />
                    <span className="font-medium text-slate-800">Credit / Debit Card</span>
                  </label>
                  <div className="mt-4 pl-7 space-y-4">
                    <Input label="Card Number" placeholder="0000 0000 0000 0000" />
                    <div className="grid grid-cols-2 gap-4">
                      <Input label="Expiry (MM/YY)" placeholder="MM/YY" />
                      <Input label="CVV" type="password" placeholder="123" />
                    </div>
                  </div>
                </div>
                
                <div className="p-4 border-b border-slate-200 hover:bg-slate-50 transition-colors">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="radio" name="payment_method" className="text-brand-600 h-4 w-4" />
                    <span className="font-medium text-slate-800">UPI (GPay, PhonePe, Paytm)</span>
                  </label>
                </div>
                
                <div className="p-4 hover:bg-slate-50 transition-colors">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="radio" name="payment_method" className="text-brand-600 h-4 w-4" />
                    <span className="font-medium text-slate-800">Cash on Delivery</span>
                  </label>
                </div>
              </div>

              {paymentSetupError ? (
                <div className="mt-6">
                  <ErrorMessage
                    message={`Couldn't start the payment: ${paymentSetupError}`}
                  />
                  <Button
                    className="mt-3"
                    variant="outline"
                    onClick={() => setupIntent(order.id)}
                  >
                    Retry payment setup
                  </Button>
                </div>
              ) : (
                <div className="mt-8 flex flex-col gap-3">
                  <Button size="lg" className="w-full bg-[#fb641b] hover:bg-[#f05c14] border-none font-bold" onClick={completePayment} loading={paying} disabled={!intentReady}>
                    PAY {formatPrice(order.totalAmount)}
                  </Button>
                  <Button
                    size="md"
                    variant="ghost"
                    className="w-full text-slate-500 text-sm hover:text-slate-700 underline"
                    onClick={failPayment}
                    disabled={paying || !intentReady}
                  >
                    Simulate failed payment for testing
                  </Button>
                </div>
              )}
              {!intentReady && !paymentSetupError && (
                <p className="mt-3 text-xs text-slate-400">Preparing secure payment…</p>
              )}
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-20">
              <h2 className="text-sm font-semibold text-slate-800">Order summary</h2>
              <div className="mt-3">
                <OrderItemsList items={order.items} />
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                <span className="text-sm text-slate-600">Total</span>
                <span className="text-xl font-bold text-slate-900">
                  {formatPrice(order.totalAmount)}
                </span>
              </div>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  // ---- Address step ----
  return (
    <div className="py-6">
      <h1 className="mb-1 text-2xl font-bold text-slate-900">Checkout</h1>
      <Stepper step="address" />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <h2 className="mb-4 text-sm font-semibold text-slate-800">Shipping address</h2>
            {error && <ErrorMessage message={error} className="mb-4" />}
            
            {loadingAddresses ? (
              <LoadingSpinner />
            ) : (
              <form onSubmit={placeOrder} noValidate>
                {savedAddresses.length > 0 && (
                  <div className="mb-6 space-y-3">
                    {savedAddresses.map(addr => (
                      <div 
                        key={addr.id} 
                        onClick={() => {
                          setSelectedAddressId(addr.id)
                          setUseManualAddress(false)
                        }}
                        className={`cursor-pointer border rounded-lg p-4 transition-colors ${!useManualAddress && selectedAddressId === addr.id ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500' : 'border-slate-200 hover:border-slate-300'}`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <input 
                            type="radio" 
                            checked={!useManualAddress && selectedAddressId === addr.id}
                            readOnly
                            className="text-brand-600"
                          />
                          <span className="font-medium text-slate-900">{addr.label || 'Saved Address'}</span>
                          {addr.isDefault && <span className="text-xs bg-slate-200 px-1.5 py-0.5 rounded text-slate-600 font-medium">Default</span>}
                        </div>
                        <div className="ml-5 text-sm text-slate-600">
                          {addr.street}, {addr.city}, {addr.state} {addr.pinCode}
                        </div>
                      </div>
                    ))}
                    <div 
                      onClick={() => setUseManualAddress(true)}
                      className={`cursor-pointer border rounded-lg p-4 transition-colors ${useManualAddress ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500' : 'border-slate-200 hover:border-slate-300'}`}
                    >
                      <div className="flex items-center gap-2">
                        <input 
                          type="radio" 
                          checked={useManualAddress}
                          readOnly
                          className="text-brand-600"
                        />
                        <span className="font-medium text-slate-900">Use a different address</span>
                      </div>
                    </div>
                  </div>
                )}
                
                {useManualAddress && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {ADDRESS_FIELDS.map((f) => (
                      <Input
                        key={f.key}
                        label={f.label}
                        value={form[f.key]}
                        onChange={setField(f.key)}
                        error={fieldErrors[f.key]}
                        placeholder={f.placeholder}
                        autoComplete={f.autoComplete}
                        className={f.full ? 'sm:col-span-2' : ''}
                        required
                      />
                    ))}
                  </div>
                )}
                
                <Button type="submit" size="lg" className="mt-6" loading={submitting}>
                  Place order &amp; continue to payment
                </Button>
              </form>
            )}
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card className="sticky top-20">
            <h2 className="text-sm font-semibold text-slate-800">Order summary</h2>
            <ul className="mt-3 divide-y divide-slate-100">
              {items.map((item) => (
                <li key={item.variantId} className="flex items-start justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800">
                      {item.productName}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatPrice(item.unitPrice)} × {item.quantity}
                    </p>
                  </div>
                  <span className="whitespace-nowrap text-sm font-semibold text-slate-900">
                    {formatPrice(item.subTotal)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
              <span className="text-sm text-slate-600">Total</span>
              <span className="text-xl font-bold text-slate-900">
                {formatPrice(totalPrice)}
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-400">
              Final total is calculated and confirmed by the server when your order is
              placed.
            </p>
          </Card>
        </div>
      </div>
    </div>
  )
}
