import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { profileApi } from '../api/profile'
import { useToast } from '../context/ToastContext'
import { Button, LoadingSpinner, ErrorMessage, Modal, Input } from '../components/ui'
import Orders from './Orders'

const EMPTY_ADDRESS = { label: '', street: '', city: '', state: '', pinCode: '', phone: '', isDefault: false }

export default function Profile() {
  const { user } = useAuth()
  const { addToast } = useToast()
  
  const [activeTab, setActiveTab] = useState('info')
  const [profileData, setProfileData] = useState(null)
  const [addresses, setAddresses] = useState([])
  const [loading, setLoading] = useState(true)
  
  const [editInfo, setEditInfo] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [savingInfo, setSavingInfo] = useState(false)

  const [addressModalOpen, setAddressModalOpen] = useState(false)
  const [addressForm, setAddressForm] = useState(EMPTY_ADDRESS)
  const [editingAddressId, setEditingAddressId] = useState(null)
  const [savingAddress, setSavingAddress] = useState(false)
  const [addressError, setAddressError] = useState(null)
  const [fieldErrors, setFieldErrors] = useState({})
  
  useEffect(() => {
    loadData()
  }, [])
  
  const loadData = async () => {
    setLoading(true)
    try {
      const [prof, addrs] = await Promise.all([
        profileApi.get().catch(() => null),
        profileApi.getAddresses().catch(() => [])
      ])
      
      setProfileData(prof || user)
      setName(prof?.name || user?.name || '')
      setPhone(prof?.phone || '')
      setAddresses(Array.isArray(addrs) ? addrs : [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const reloadAddresses = async () => {
    try {
      const addrs = await profileApi.getAddresses()
      setAddresses(Array.isArray(addrs) ? addrs : [])
    } catch (err) {
      console.error(err)
    }
  }

  const handleSaveInfo = async (e) => {
    e.preventDefault()
    setSavingInfo(true)
    try {
      const updated = await profileApi.update({ name, phone })
      setProfileData(updated)
      setEditInfo(false)
      addToast('Profile updated successfully')
    } catch (err) {
      addToast('Failed to update profile', 'error')
    } finally {
      setSavingInfo(false)
    }
  }

  const openAddAddress = () => {
    setAddressForm(EMPTY_ADDRESS)
    setEditingAddressId(null)
    setAddressError(null)
    setFieldErrors({})
    setAddressModalOpen(true)
  }

  const openEditAddress = (addr) => {
    setAddressForm({
      label: addr.label || '',
      street: addr.street || '',
      city: addr.city || '',
      state: addr.state || '',
      pinCode: addr.pinCode || '',
      phone: addr.phone || '',
      isDefault: addr.isDefault || false
    })
    setEditingAddressId(addr.id)
    setAddressError(null)
    setFieldErrors({})
    setAddressModalOpen(true)
  }

  const validateAddress = () => {
    const errs = {}
    if (!addressForm.street.trim()) errs.street = 'Street is required.'
    if (!addressForm.city.trim()) errs.city = 'City is required.'
    if (!addressForm.state.trim()) errs.state = 'State is required.'
    if (!addressForm.pinCode.trim()) errs.pinCode = 'PIN Code is required.'
    if (!addressForm.phone.trim()) errs.phone = 'Phone is required.'
    setFieldErrors(errs)
    return Object.keys(errs).length === 0
  }

  const saveAddress = async (e) => {
    e.preventDefault()
    setAddressError(null)
    if (!validateAddress()) return
    setSavingAddress(true)
    try {
      if (editingAddressId) {
        await profileApi.updateAddress(editingAddressId, addressForm)
        addToast('Address updated')
      } else {
        await profileApi.addAddress(addressForm)
        addToast('Address added')
      }
      setAddressModalOpen(false)
      await reloadAddresses()
    } catch (err) {
      setAddressError(err.message || 'Failed to save address')
    } finally {
      setSavingAddress(false)
    }
  }

  const handleDeleteAddress = async (id) => {
    if (!window.confirm('Are you sure you want to delete this address?')) return
    try {
      await profileApi.deleteAddress(id)
      addToast('Address deleted')
      await reloadAddresses()
    } catch (err) {
      addToast('Failed to delete address', 'error')
    }
  }

  const handleSetDefault = async (id) => {
    try {
      await profileApi.setDefaultAddress(id)
      addToast('Default address updated')
      await reloadAddresses()
    } catch (err) {
      addToast('Failed to set default address', 'error')
    }
  }
  
  if (loading) return <LoadingSpinner fullPage />

  return (
    <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-6">
      
      {/* Sidebar sidebar */}
      <div className="w-full md:w-64 shrink-0">
        <div className="bg-white rounded-xl border border-slate-200 p-6 flex items-center gap-4 mb-4 shadow-sm">
          <div className="h-12 w-12 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center text-xl font-bold">
            {profileData?.name ? profileData.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <div className="text-xs text-slate-500">Hello,</div>
            <div className="font-bold text-slate-900 truncate">{profileData?.name}</div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <button 
            onClick={() => setActiveTab('info')}
            className={`w-full text-left px-6 py-4 border-b border-slate-100 font-medium text-sm transition-colors ${activeTab === 'info' ? 'text-brand-600 bg-brand-50/50' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            Personal Information
          </button>
          <button 
            onClick={() => setActiveTab('addresses')}
            className={`w-full text-left px-6 py-4 border-b border-slate-100 font-medium text-sm transition-colors ${activeTab === 'addresses' ? 'text-brand-600 bg-brand-50/50' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            Manage Addresses
          </button>
          <button 
            onClick={() => setActiveTab('orders')}
            className={`w-full text-left px-6 py-4 font-medium text-sm transition-colors ${activeTab === 'orders' ? 'text-brand-600 bg-brand-50/50' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            My Orders
          </button>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8 min-h-[500px]">
        {activeTab === 'info' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-900">Personal Information</h2>
              {!editInfo && (
                <button onClick={() => setEditInfo(true)} className="text-brand-600 font-medium text-sm hover:underline">
                  Edit
                </button>
              )}
            </div>
            
            {editInfo ? (
              <form onSubmit={handleSaveInfo} className="max-w-md space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full border-slate-300 rounded-md focus:border-brand-500 focus:ring-brand-500 sm:text-sm px-3 py-2 border" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                  <input type="email" value={profileData?.email || ''} disabled className="w-full border-slate-200 bg-slate-50 rounded-md sm:text-sm px-3 py-2 border text-slate-500 cursor-not-allowed" />
                  <p className="text-xs text-slate-400 mt-1">Email address cannot be changed</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="w-full border-slate-300 rounded-md focus:border-brand-500 focus:ring-brand-500 sm:text-sm px-3 py-2 border" />
                </div>
                <div className="flex gap-3 pt-4">
                  <Button type="submit" loading={savingInfo}>Save Changes</Button>
                  <Button variant="ghost" onClick={() => setEditInfo(false)}>Cancel</Button>
                </div>
              </form>
            ) : (
              <div className="max-w-md space-y-6">
                <div>
                  <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Full Name</div>
                  <div className="font-medium text-slate-900">{profileData?.name || 'Not provided'}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Email Address</div>
                  <div className="font-medium text-slate-900">{profileData?.email || 'Not provided'}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Phone Number</div>
                  <div className="font-medium text-slate-900">{profileData?.phone || 'Not provided'}</div>
                </div>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'addresses' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-900">Manage Addresses</h2>
              <Button size="sm" onClick={openAddAddress}>+ Add Address</Button>
            </div>
            
            {addresses.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-sm">
                No addresses saved yet.
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {addresses.map(addr => (
                  <div key={addr.id} className="border border-slate-200 rounded-lg p-4 relative group hover:border-slate-300">
                    {addr.isDefault && (
                      <span className="absolute top-4 right-4 bg-slate-100 text-slate-600 text-xs font-bold px-2 py-1 rounded">DEFAULT</span>
                    )}
                    <div className="font-bold text-slate-900 mb-2">{addr.label || 'Home'}</div>
                    <div className="text-sm text-slate-600 leading-relaxed mb-4">
                      {addr.street}<br/>
                      {addr.city}, {addr.state} {addr.pinCode}<br/>
                      {addr.phone && <span className="mt-2 block font-medium">Phone: {addr.phone}</span>}
                    </div>
                    <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-100">
                      <Button size="sm" variant="outline" onClick={() => openEditAddress(addr)}>Edit</Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDeleteAddress(addr.id)}>Delete</Button>
                      {!addr.isDefault && (
                        <Button size="sm" variant="ghost" onClick={() => handleSetDefault(addr.id)}>Set Default</Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'orders' && (
          <div className="-mx-6 sm:-mx-8 px-6 sm:px-8">
            <h2 className="text-xl font-bold text-slate-900 mb-6">My Orders</h2>
            <Orders inline />
          </div>
        )}
      </div>

      <Modal
        open={addressModalOpen}
        onClose={() => !savingAddress && setAddressModalOpen(false)}
        title={editingAddressId ? 'Edit Address' : 'Add Address'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setAddressModalOpen(false)} disabled={savingAddress}>Cancel</Button>
            <Button onClick={saveAddress} loading={savingAddress}>Save</Button>
          </>
        }
      >
        <form onSubmit={saveAddress} className="space-y-4" noValidate>
          {addressError && <ErrorMessage message={addressError} />}
          <Input
            label="Label (e.g. Home, Work)"
            value={addressForm.label}
            onChange={e => setAddressForm({...addressForm, label: e.target.value})}
            placeholder="Home"
          />
          <Input
            label="Street Address"
            value={addressForm.street}
            onChange={e => setAddressForm({...addressForm, street: e.target.value})}
            error={fieldErrors.street}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="City"
              value={addressForm.city}
              onChange={e => setAddressForm({...addressForm, city: e.target.value})}
              error={fieldErrors.city}
              required
            />
            <Input
              label="State"
              value={addressForm.state}
              onChange={e => setAddressForm({...addressForm, state: e.target.value})}
              error={fieldErrors.state}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="PIN Code"
              value={addressForm.pinCode}
              onChange={e => setAddressForm({...addressForm, pinCode: e.target.value})}
              error={fieldErrors.pinCode}
              required
            />
            <Input
              label="Phone Number"
              value={addressForm.phone}
              onChange={e => setAddressForm({...addressForm, phone: e.target.value})}
              error={fieldErrors.phone}
              required
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700 pt-2">
            <input
              type="checkbox"
              checked={addressForm.isDefault}
              onChange={e => setAddressForm({...addressForm, isDefault: e.target.checked})}
              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-300"
            />
            Set as default address
          </label>
        </form>
      </Modal>
    </div>
  )
}
