import { MapPin, Sprout, Trash2, Plus, Pencil, Check, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import EmptyState from '../components/EmptyState'
import TopBar from '../components/TopBar'
import { createFarmProfile, deleteFarmProfile, getFarmProfiles, updateFarmProfile } from '../services/api'

const SOIL_TYPES = ['Clay', 'Sandy', 'Loamy', 'Silty', 'Peaty', 'Chalky', 'Black', 'Red']
const CROP_OPTIONS = ['Rice', 'Wheat', 'Maize', 'Tomato', 'Potato', 'Onion', 'Soybean', 'Cotton', 'Sugarcane', 'Groundnut', 'Sunflower', 'Chilli', 'Turmeric', 'Coffee', 'Tea', 'Banana', 'Mango']

function FarmForm({ initial, onSave, onCancel, saving }) {
  const [form, setForm] = useState(initial)
  const [error, setError] = useState('')

  useEffect(() => { setForm(initial) }, [initial])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const toggleCrop = (crop) => {
    const current = form.crops_grown ? form.crops_grown.split(',').map(c => c.trim()).filter(Boolean) : []
    const updated = current.includes(crop) ? current.filter(c => c !== crop) : [...current, crop]
    set('crops_grown', updated.join(', '))
  }

  const handleSave = () => {
    if (!form.name?.trim()) { setError('Farm name is required'); return }
    setError('')
    onSave(form, setError)
  }

  return (
    <div
      className="rounded-2xl p-6 animate-scale-in"
      style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}
    >
      <h3 className="text-base font-bold mb-5" style={{ color: 'var(--color-text)' }}>
        {form.id ? 'Edit Farm Profile' : 'New Farm Profile'}
      </h3>

      {error && (
        <div className="alert alert-danger mb-4">
          <span>⚠️</span><span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="label">Farm Name *</label>
          <input value={form.name || ''} onChange={e => set('name', e.target.value)} placeholder="My Farm" className="input" />
        </div>
        <div>
          <label className="label">Location</label>
          <input value={form.location || ''} onChange={e => set('location', e.target.value)} placeholder="Tamil Nadu, India" className="input" />
        </div>
        <div>
          <label className="label">Soil Type</label>
          <select value={form.soil_type || ''} onChange={e => set('soil_type', e.target.value)} className="input select">
            <option value="">Select soil type</option>
            {SOIL_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Acreage (hectares)</label>
          <input type="number" value={form.acreage || ''} onChange={e => set('acreage', e.target.value)} placeholder="5.0" className="input" />
        </div>
      </div>

      <div className="mb-5">
        <label className="label">Crops Grown</label>
        <div className="flex flex-wrap gap-2">
          {CROP_OPTIONS.map(crop => (
            <button
              key={crop}
              type="button"
              onClick={() => toggleCrop(crop)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-150"
              style={{
                background: (form.crops_grown || '').includes(crop) ? 'var(--color-primary)' : 'var(--color-surface)',
                borderColor: (form.crops_grown || '').includes(crop) ? 'var(--color-primary)' : 'var(--color-border)',
                color: (form.crops_grown || '').includes(crop) ? 'white' : 'var(--color-text-secondary)',
              }}
            >
              {crop}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={handleSave} disabled={saving} className="btn btn-primary">
          {saving ? <><span className="spinner spinner-sm" />Saving...</> : <><Check size={15} /> Save</>}
        </button>
        <button onClick={onCancel} className="btn btn-secondary">
          <X size={15} /> Cancel
        </button>
      </div>
    </div>
  )
}

export default function Farm() {
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingProfile, setEditingProfile] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => { loadProfiles() }, [])

  const loadProfiles = async () => {
    setLoading(true)
    try {
      const resp = await getFarmProfiles()
      setProfiles(resp.data.profiles || [])
    } catch { setProfiles([]) }
    finally { setLoading(false) }
  }

  const openNew = () => {
    setEditingProfile({ name: '', location: '', soil_type: '', acreage: '', crops_grown: '' })
    setShowForm(true)
    setError(''); setSuccess('')
  }

  const openEdit = (p) => {
    setEditingProfile({ ...p })
    setShowForm(true)
    setError(''); setSuccess('')
  }

  const handleSave = async (form, setLocalError) => {
    setSaving(true)
    setError('')
    try {
      if (editingProfile.id) {
        await updateFarmProfile(editingProfile.id, form)
        setSuccess('Farm profile updated!')
      } else {
        await createFarmProfile(form)
        setSuccess('Farm profile created!')
      }
      setShowForm(false)
      loadProfiles()
    } catch (err) {
      setLocalError(err.response?.data?.detail || 'Save failed')
    } finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this farm profile?')) return
    try { await deleteFarmProfile(id); loadProfiles() }
    catch { setError('Delete failed') }
  }

  return (
    <div className="flex-1 flex flex-col overflow-y-auto">
      <TopBar title="My Farm" subtitle="Manage your farm profiles and settings" />

      <div className="page-container">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="section-title">Farm Profiles</h2>
            <p className="section-subtitle">{profiles.length} saved profile{profiles.length !== 1 ? 's' : ''}</p>
          </div>
          <button onClick={openNew} className="btn btn-primary">
            <Plus size={16} /> Add Farm
          </button>
        </div>

        {error && <div className="alert alert-danger mb-4"><span>⚠️</span><span>{error}</span></div>}
        {success && <div className="alert alert-success mb-4 animate-fade-up"><span>✅</span><span>{success}</span></div>}

        {showForm && (
          <div className="mb-6">
            <FarmForm
              initial={editingProfile}
              onSave={handleSave}
              onCancel={() => setShowForm(false)}
              saving={saving}
            />
          </div>
        )}

        {/* Loading skeletons */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {[1, 2, 3].map(i => (
              <div key={i} className="skeleton" style={{ height: 160, borderRadius: 'var(--radius-xl)' }} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && profiles.length === 0 && !showForm && (
          <EmptyState
            icon={MapPin}
            title="No farm profiles yet"
            description="Add your first farm to get personalized crop recommendations and auto-fill advisor inputs."
            action={<button onClick={openNew} className="btn btn-primary"><Plus size={15} /> Add Farm Profile</button>}
          />
        )}

        {/* Profile cards */}
        {!loading && profiles.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 stagger-children">
            {profiles.map(p => (
              <div
                key={p.id}
                className="card animate-fade-up"
                style={{ padding: '22px', borderColor: 'var(--color-border)' }}
              >
                {/* Card header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex items-center justify-center rounded-2xl"
                      style={{ width: 44, height: 44, background: 'rgba(16,185,129,0.1)' }}
                    >
                      <MapPin size={20} style={{ color: 'var(--color-primary)' }} strokeWidth={1.75} />
                    </div>
                    <div>
                      <p className="font-bold text-sm" style={{ color: 'var(--color-text)' }}>{p.name}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{p.location || 'No location set'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEdit(p)}
                      className="btn btn-ghost btn-icon btn-sm"
                      title="Edit farm"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="btn btn-ghost btn-icon btn-sm"
                      title="Delete farm"
                      style={{ color: 'var(--color-danger)' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {p.soil_type && (
                    <span className="badge badge-info">{p.soil_type}</span>
                  )}
                  {p.acreage && (
                    <span className="badge badge-warning">{parseFloat(p.acreage)} ha</span>
                  )}
                </div>

                {/* Crops */}
                {p.crops_grown && (
                  <div className="flex flex-wrap gap-1.5">
                    {p.crops_grown.split(',').map(c => c.trim()).filter(Boolean).map(crop => (
                      <span
                        key={crop}
                        className="px-2 py-0.5 rounded-full text-[11px] font-medium"
                        style={{ background: 'rgba(16,185,129,0.08)', color: 'var(--color-primary)', border: '1px solid rgba(16,185,129,0.15)' }}
                      >
                        {crop}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
