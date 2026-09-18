import { useCallback, useEffect, useState } from 'react'
import { categoriesApi } from '../../api/categories'
import { adminApi } from '../../api/admin'
import { getErrorMessage } from '../../lib/errors'
import {
  Button,
  Input,
  Textarea,
  Card,
  Modal,
  LoadingSpinner,
  EmptyState,
  ErrorMessage,
} from '../../components/ui'
import AdminNav from '../../components/admin/AdminNav'

const EMPTY_FORM = { name: '', description: '' }

export default function AdminCategories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Create/edit modal state
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null) // category being edited, or null for create
  const [form, setForm] = useState(EMPTY_FORM)
  const [formError, setFormError] = useState(null)
  const [nameError, setNameError] = useState(null)
  const [saving, setSaving] = useState(false)

  // Delete confirm state
  const [deleting, setDeleting] = useState(null) // category pending deletion
  const [deleteError, setDeleteError] = useState(null)
  const [deletingBusy, setDeletingBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await categoriesApi.list()
      setCategories(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setNameError(null)
    setFormError(null)
    setFormOpen(true)
  }

  const openEdit = (category) => {
    setEditing(category)
    setForm({ name: category.name || '', description: category.description || '' })
    setNameError(null)
    setFormError(null)
    setFormOpen(true)
  }

  const submitForm = async (e) => {
    e.preventDefault()
    setFormError(null)
    if (!form.name.trim()) {
      setNameError('Category name is required.')
      return
    }
    setNameError(null)
    setSaving(true)
    const payload = { name: form.name.trim(), description: form.description.trim() }
    try {
      if (editing) await adminApi.updateCategory(editing.id, payload)
      else await adminApi.createCategory(payload)
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
      await adminApi.deleteCategory(deleting.id)
      setDeleting(null)
      await load()
    } catch (err) {
      // e.g. a category still referenced by products may be rejected.
      setDeleteError(getErrorMessage(err))
    } finally {
      setDeletingBusy(false)
    }
  }

  return (
    <div className="py-6">
      <AdminNav activeKey="categories" />

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Categories</h2>
        <Button onClick={openCreate}>New category</Button>
      </div>

      {loading ? (
        <LoadingSpinner size="lg" />
      ) : error ? (
        <ErrorMessage error={error} onRetry={load} />
      ) : categories.length === 0 ? (
        <EmptyState
          title="No categories yet"
          message="Create your first category so products can be organized."
          action={<Button onClick={openCreate}>New category</Button>}
        />
      ) : (
        <div className="space-y-2">
          {categories.map((category) => (
            <Card key={category.id} className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="font-medium text-slate-900">{category.name}</p>
                {category.description && (
                  <p className="mt-0.5 text-sm text-slate-500">{category.description}</p>
                )}
              </div>
              <div className="flex flex-shrink-0 gap-2">
                <Button size="sm" variant="outline" onClick={() => openEdit(category)}>
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setDeleteError(null)
                    setDeleting(category)
                  }}
                >
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create / edit modal */}
      <Modal
        open={formOpen}
        onClose={() => !saving && setFormOpen(false)}
        title={editing ? 'Edit category' : 'New category'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setFormOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={submitForm} loading={saving}>
              {editing ? 'Save changes' : 'Create category'}
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
            error={nameError}
            placeholder="e.g. Electronics"
            required
          />
          <Textarea
            label="Description"
            rows={3}
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Optional short description"
          />
        </form>
      </Modal>

      {/* Delete confirm modal */}
      <Modal
        open={Boolean(deleting)}
        onClose={() => !deletingBusy && setDeleting(null)}
        title="Delete category"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleting(null)} disabled={deletingBusy}>
              Keep it
            </Button>
            <Button variant="danger" onClick={confirmDelete} loading={deletingBusy}>
              Delete
            </Button>
          </>
        }
      >
        {deleteError && <ErrorMessage message={deleteError} className="mb-3" />}
        <p className="text-sm text-slate-600">
          Delete <span className="font-medium text-slate-900">{deleting?.name}</span>? This
          can’t be undone. If products still reference this category, the server may reject
          the deletion.
        </p>
      </Modal>
    </div>
  )
}
