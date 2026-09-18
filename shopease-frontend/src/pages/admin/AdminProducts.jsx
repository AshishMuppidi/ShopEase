import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { productsApi } from '../../api/products'
import { categoriesApi } from '../../api/categories'
import { adminApi } from '../../api/admin'
import { normalizePage } from '../../lib/page'
import { getErrorMessage } from '../../lib/errors'
import {
  Button,
  Input,
  Textarea,
  Select,
  Card,
  Badge,
  Modal,
  LoadingSpinner,
  EmptyState,
  ErrorMessage,
} from '../../components/ui'
import AdminNav from '../../components/admin/AdminNav'
import Pagination from '../../components/Pagination'

const PAGE_SIZE = 12

const EMPTY_FORM = {
  name: '',
  description: '',
  brand: '',
  thumbnail: '',
  images: '', // textarea, one URL per line
  categoryId: '',
  active: true,
}

function toForm(product) {
  return {
    name: product.name || '',
    description: product.description || '',
    brand: product.brand || '',
    thumbnail: product.thumbnail || '',
    images: Array.isArray(product.images) ? product.images.join('\n') : '',
    categoryId: product.categoryId != null ? String(product.categoryId) : '',
    active: product.active !== false,
  }
}

export default function AdminProducts() {
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Number(searchParams.get('page') || 0)

  const [pageData, setPageData] = useState(null)
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
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
      const data = await productsApi.list({ page, size: PAGE_SIZE, sortBy: 'id' })
      setPageData(normalizePage(data))
    } catch (err) {
      setError(err)
      setPageData(null)
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    categoriesApi
      .list()
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch(() => setCategories([]))
  }, [])

  const categoryOptions = useMemo(
    () => [
      { value: '', label: 'Select a category…' },
      ...categories.map((c) => ({ value: String(c.id), label: c.name })),
    ],
    [categories],
  )

  const goToPage = (p) => {
    const next = new URLSearchParams(searchParams)
    if (p <= 0) next.delete('page')
    else next.set('page', String(p))
    setSearchParams(next)
  }

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setFieldErrors({})
    setFormError(null)
    setFormOpen(true)
  }

  const openEdit = (product) => {
    setEditing(product)
    setForm(toForm(product))
    setFieldErrors({})
    setFormError(null)
    setFormOpen(true)
  }

  const validate = () => {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Product name is required.'
    if (!form.categoryId) errs.categoryId = 'Please choose a category.'
    setFieldErrors(errs)
    return Object.keys(errs).length === 0
  }

  const submitForm = async (e) => {
    e.preventDefault()
    setFormError(null)
    if (!validate()) return
    setSaving(true)
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      brand: form.brand.trim() || null,
      thumbnail: form.thumbnail.trim() || null,
      images: form.images
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
      categoryId: Number(form.categoryId),
      active: form.active,
    }
    try {
      if (editing) await adminApi.updateProduct(editing.id, payload)
      else await adminApi.createProduct(payload)
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
      await adminApi.deleteProduct(deleting.id)
      setDeleting(null)
      await load()
    } catch (err) {
      setDeleteError(getErrorMessage(err))
    } finally {
      setDeletingBusy(false)
    }
  }

  const products = pageData?.content ?? []

  return (
    <div className="py-6">
      <AdminNav activeKey="products" />

      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Products</h2>
        <Button onClick={openCreate}>New product</Button>
      </div>
      <p className="mb-4 text-xs text-slate-500">
        This list shows active products only — the storefront and this view share the same
        endpoint. Deleting a product deactivates it, which removes it from both.
      </p>

      {loading ? (
        <LoadingSpinner size="lg" />
      ) : error ? (
        <ErrorMessage error={error} onRetry={load} />
      ) : products.length === 0 ? (
        <EmptyState
          title="No active products"
          message="Create a product to get started. Newly created products appear here once active."
          action={<Button onClick={openCreate}>New product</Button>}
        />
      ) : (
        <>
          <div className="space-y-2">
            {products.map((product) => (
              <Card key={product.id} className="flex items-center gap-4">
                <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100 text-slate-300">
                  {product.thumbnail ? (
                    <img
                      src={product.thumbnail}
                      alt=""
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  ) : (
                    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <path d="M3 15l5-5 4 4 3-3 6 6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium text-slate-900">{product.name}</p>
                    {product.active === false && <Badge tone="danger">Inactive</Badge>}
                  </div>
                  <p className="truncate text-xs text-slate-500">
                    {product.brand ? `${product.brand} · ` : ''}
                    {product.categoryName || `Category #${product.categoryId}`}
                  </p>
                </div>
                <div className="flex flex-shrink-0 flex-wrap justify-end gap-2">
                  <Link
                    to={`/admin/products/${product.id}/variants`}
                    className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Variants
                  </Link>
                  <Button size="sm" variant="outline" onClick={() => openEdit(product)}>
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setDeleteError(null)
                      setDeleting(product)
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          <div className="mt-8">
            <Pagination page={pageData.number} totalPages={pageData.totalPages} onChange={goToPage} />
          </div>
        </>
      )}

      {/* Create / edit modal */}
      <Modal
        open={formOpen}
        onClose={() => !saving && setFormOpen(false)}
        title={editing ? 'Edit product' : 'New product'}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setFormOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={submitForm} loading={saving}>
              {editing ? 'Save changes' : 'Create product'}
            </Button>
          </>
        }
      >
        <form onSubmit={submitForm} className="space-y-4" noValidate>
          {formError && <ErrorMessage message={formError} />}
          <Input
            label="Name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            error={fieldErrors.name}
            placeholder="e.g. Wireless Headphones"
            required
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Brand"
              value={form.brand}
              onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))}
              placeholder="e.g. Acme"
            />
            <Select
              label="Category"
              value={form.categoryId}
              onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
              options={categoryOptions}
              error={fieldErrors.categoryId}
            />
          </div>
          <Textarea
            label="Description"
            rows={3}
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Optional product description"
          />
          <Input
            label="Thumbnail URL"
            value={form.thumbnail}
            onChange={(e) => setForm((f) => ({ ...f, thumbnail: e.target.value }))}
            placeholder="https://…"
          />
          <Textarea
            label="Image URLs"
            rows={3}
            value={form.images}
            onChange={(e) => setForm((f) => ({ ...f, images: e.target.value }))}
            hint="One URL per line."
            placeholder={'https://…\nhttps://…'}
          />
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-300"
            />
            Active (visible in the storefront)
          </label>
        </form>
      </Modal>

      {/* Delete confirm modal */}
      <Modal
        open={Boolean(deleting)}
        onClose={() => !deletingBusy && setDeleting(null)}
        title="Delete product"
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
          Deleting <span className="font-medium text-slate-900">{deleting?.name}</span>{' '}
          deactivates it: it disappears from the storefront and from this list. Existing
          orders are unaffected.
        </p>
      </Modal>
    </div>
  )
}
