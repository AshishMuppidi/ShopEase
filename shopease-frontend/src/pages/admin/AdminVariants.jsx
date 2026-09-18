import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { productsApi } from '../../api/products'
import { adminApi } from '../../api/admin'
import { formatPrice } from '../../lib/format'
import { getErrorMessage, statusOf } from '../../lib/errors'
import {
  Button,
  Input,
  Textarea,
  Card,
  Badge,
  Modal,
  LoadingSpinner,
  EmptyState,
  ErrorMessage,
} from '../../components/ui'
import AdminNav from '../../components/admin/AdminNav'

const EMPTY_FORM = {
  sku: '',
  attributes: '',
  price: '',
  initialInventory: '',
  active: true,
}

function readableAttributes(attributes) {
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

export default function AdminVariants() {
  const { productId } = useParams()

  const [product, setProduct] = useState(null)
  const [variants, setVariants] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState(null)
  const [saving, setSaving] = useState(false)

  const [deleting, setDeleting] = useState(null)
  const [deleteError, setDeleteError] = useState(null)
  const [deletingBusy, setDeletingBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [prod, vars] = await Promise.all([
        productsApi.get(productId),
        productsApi.variants(productId).catch(() => []),
      ])
      setProduct(prod)
      setVariants(Array.isArray(vars) ? vars : [])
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [productId])

  useEffect(() => {
    load()
  }, [load])

  const openCreate = () => {
    setForm(EMPTY_FORM)
    setFieldErrors({})
    setFormError(null)
    setFormOpen(true)
  }

  const validate = () => {
    const errs = {}
    if (!form.sku.trim()) errs.sku = 'SKU is required.'
    if (!form.attributes.trim()) errs.attributes = 'Attributes are required.'
    const price = Number(form.price)
    if (!form.price || Number.isNaN(price) || price <= 0)
      errs.price = 'Enter a price greater than zero.'

    const inv = Number(form.initialInventory)
    if (form.initialInventory === '' || Number.isNaN(inv) || inv < 0 || !Number.isInteger(inv))
      errs.initialInventory = 'Enter a whole number (0 or more).'

    setFieldErrors(errs)
    return Object.keys(errs).length === 0
  }

  const submitForm = async (e) => {
    e.preventDefault()
    setFormError(null)
    if (!validate()) return
    setSaving(true)

    try {
      const payload = {
        productId: Number(productId),
        sku: form.sku.trim(),
        attributes: form.attributes.trim(),
        price: Number(form.price),
        initialInventory: Number(form.initialInventory),
        active: form.active,
      }
      await adminApi.createVariant(payload)
      setFormOpen(false)
      await load()
    } catch (err) {
      setFormError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = async () => {
    setDeleteError(null)
    setDeletingBusy(true)
    try {
      await adminApi.deleteVariant(deleting.id)
      setDeleting(null)
      await load()
    } catch (err) {
      setDeleteError(getErrorMessage(err))
    } finally {
      setDeletingBusy(false)
    }
  }

  if (loading) return <LoadingSpinner fullPage size="lg" />

  if (error) {
    const notFound = statusOf(error) === 404
    return (
      <div className="py-6">
        <AdminNav activeKey="products" />
        {notFound ? (
          <div className="mx-auto max-w-md py-6 text-center">
            <h2 className="text-xl font-bold text-slate-900">Product not found</h2>
            <Link
              to="/admin/products"
              className="mt-4 inline-block font-medium text-brand-600 hover:text-brand-700"
            >
              ← Back to products
            </Link>
          </div>
        ) : (
          <ErrorMessage error={error} onRetry={load} />
        )}
      </div>
    )
  }

  return (
    <div className="py-6">
      <AdminNav activeKey="products" />

      <nav className="mb-4 text-sm text-slate-500">
        <Link to="/admin/products" className="hover:text-slate-700">
          Products
        </Link>
        <span className="mx-2 text-slate-300">/</span>
        <span className="text-slate-700">{product?.name} · Variants</span>
      </nav>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Variants for {product?.name}</h2>
          <p className="text-xs text-slate-500">
            Variants can be created and deactivated. Stock is displayed using available inventory.
          </p>
        </div>
        <Button onClick={openCreate}>New variant</Button>
      </div>

      {variants.length === 0 ? (
        <EmptyState
          title="No variants yet"
          message="Add a purchasable variant (SKU, price, inventory) so this product can be sold."
          action={<Button onClick={openCreate}>New variant</Button>}
        />
      ) : (
        <div className="space-y-2">
          {variants.map((variant) => (
            <Card key={variant.id} className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-slate-900">{variant.sku}</p>
                  {variant.active === false ? (
                    <Badge tone="danger">Inactive</Badge>
                  ) : (
                    <Badge tone="success">Active</Badge>
                  )}
                </div>
                {readableAttributes(variant.attributes) && (
                  <p className="mt-0.5 truncate text-xs text-slate-500">
                    {readableAttributes(variant.attributes)}
                  </p>
                )}
                <p className="mt-0.5 text-xs text-slate-500">
                  {formatPrice(variant.price)}{' '}
                  {variant.originalPrice ? (
                    <span className="line-through text-slate-400 ml-1">
                      {formatPrice(variant.originalPrice)}
                    </span>
                  ) : (
                    ''
                  )}{' '}
                  · <span className="font-medium text-slate-700">{variant.availableQuantity ?? 0}</span> in stock
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setDeleteError(null)
                    setDeleting(variant)
                  }}
                  disabled={variant.active === false}
                >
                  {variant.active === false ? 'Deactivated' : 'Delete'}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create modal */}
      <Modal
        open={formOpen}
        onClose={() => !saving && setFormOpen(false)}
        title="New variant"
        footer={
          <>
            <Button variant="ghost" onClick={() => setFormOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={submitForm} loading={saving}>
              Create variant
            </Button>
          </>
        }
      >
        <form onSubmit={submitForm} className="space-y-4" noValidate>
          {formError && <ErrorMessage message={formError} />}
          <Input
            label="SKU"
            value={form.sku}
            onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
            error={fieldErrors.sku}
            placeholder="e.g. HEADPHONE-BLK-M"
            required
          />
          <Textarea
            label="Attributes"
            rows={3}
            value={form.attributes}
            onChange={(e) => setForm((f) => ({ ...f, attributes: e.target.value }))}
            error={fieldErrors.attributes}
            hint={'JSON like {"color":"Black","size":"M"} or plain text.'}
            placeholder={'{"color":"Black","size":"M"}'}
            required
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Price"
              type="number"
              step="0.01"
              min="0"
              value={form.price}
              onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
              error={fieldErrors.price}
              placeholder="0.00"
              required
            />
            <Input
              label="Initial inventory"
              type="number"
              step="1"
              min="0"
              value={form.initialInventory}
              onChange={(e) => setForm((f) => ({ ...f, initialInventory: e.target.value }))}
              error={fieldErrors.initialInventory}
              placeholder="0"
              required
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-300"
            />
            Active (available for purchase)
          </label>
        </form>
      </Modal>

      {/* Delete confirm modal */}
      <Modal
        open={Boolean(deleting)}
        onClose={() => !deletingBusy && setDeleting(null)}
        title="Delete variant"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleting(null)} disabled={deletingBusy}>
              Keep it
            </Button>
            <Button variant="danger" onClick={confirmDelete} loading={deletingBusy}>
              Deactivate
            </Button>
          </>
        }
      >
        {deleteError && <ErrorMessage message={deleteError} className="mb-3" />}
        <p className="text-sm text-slate-600">
          Deleting SKU <span className="font-medium text-slate-900">{deleting?.sku}</span>{' '}
          deactivates it so it can no longer be purchased. It will remain listed here as
          inactive.
        </p>
      </Modal>
    </div>
  )
}
