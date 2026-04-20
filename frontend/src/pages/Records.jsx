import { FolderOpen, Plus, Pencil, Trash2, TrendingUp } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts'
import EmptyState from '../components/EmptyState'
import TopBar from '../components/TopBar'
import { createYieldRecord, deleteYieldRecord, getYieldRecords, updateYieldRecord } from '../services/api'

const CROP_OPTIONS = ['Rice', 'Wheat', 'Maize', 'Tomato', 'Potato', 'Onion', 'Soybean', 'Cotton', 'Sugarcane', 'Groundnut', 'Sunflower', 'Chilli', 'Turmeric', 'Coffee', 'Tea', 'Banana', 'Mango']

const EMPTY_FORM = { crop: '', year: new Date().getFullYear(), yield_kg_per_ha: '', area_ha: '', notes: '' }

export default function Records() {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')

  useEffect(() => { loadRecords() }, [])

  const loadRecords = async () => {
    setLoading(true)
    try {
      const resp = await getYieldRecords()
      setRecords(resp.data.records || [])
    } catch { setRecords([]) }
    finally { setLoading(false) }
  }

  const openNew = () => {
    setForm(EMPTY_FORM)
    setEditingId(null)
    setShowForm(true)
    setError('')
    setSuccess('')
  }

  const openEdit = (r) => {
    setForm({ crop: r.crop, year: r.year, yield_kg_per_ha: r.yield_kg_per_ha, area_ha: r.area_ha || '', notes: r.notes || '' })
    setEditingId(r.id)
    setShowForm(true)
    setError('')
    setSuccess('')
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: name === 'crop' ? value : name === 'year' ? parseInt(value) : value }))
  }

  const handleSave = async () => {
    if (!form.crop || !form.year || !form.yield_kg_per_ha) { setError('Crop, year, and yield are required'); return }
    setSaving(true)
    setError('')
    try {
      const payload = {
        crop: form.crop,
        year: form.year,
        yield_kg_per_ha: parseFloat(form.yield_kg_per_ha),
        area_ha: form.area_ha ? parseFloat(form.area_ha) : undefined,
        notes: form.notes || undefined,
      }
      if (editingId) {
        await updateYieldRecord(editingId, payload)
        setSuccess('Record updated!')
      } else {
        await createYieldRecord(payload)
        setSuccess('Record added!')
      }
      setShowForm(false)
      loadRecords()
    } catch (err) {
      setError(err.response?.data?.detail || 'Save failed')
    } finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this yield record?')) return
    try { await deleteYieldRecord(id); loadRecords() } catch { setError('Delete failed') }
  }

  // Chart data: yield trend by year
  const chartData = [...records]
    .sort((a, b) => a.year - b.year)
    .reduce((acc, r) => {
      const existing = acc.find(d => d.year === r.year)
      if (existing) {
        existing.yield += parseFloat(r.yield_kg_per_ha)
        existing.count += 1
      } else {
        acc.push({ year: r.year, yield: parseFloat(r.yield_kg_per_ha), count: 1 })
      }
      return acc
    }, [])
    .map(d => ({ ...d, avgYield: Math.round(d.yield / d.count) }))

  return (
    <div className="flex-1 flex flex-col overflow-y-auto">
      <TopBar title="Yield Records" subtitle="Track and analyse harvest data over time" />
      <div className="page-container">

        {error && <div className="alert alert-danger mb-6"><span>⚠️</span><span>{error}</span></div>}
        {success && <div className="alert alert-success mb-6 animate-fade-up"><span>✅</span><span>{success}</span></div>}

        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="section-title">Harvest History</h2>
            <p className="section-subtitle">{records.length} record{records.length !== 1 ? 's' : ''}</p>
          </div>
          <button onClick={openNew} className="btn btn-primary">
            <Plus size={14} /> Add Record
          </button>
        </div>

        {showForm && (
          <div className="card mb-6" style={{ padding: '28px', borderColor: 'var(--color-border)' }}>
            <h3 className="font-semibold mb-5" style={{ color: 'var(--color-text)' }}>{editingId ? 'Edit Record' : 'New Yield Record'}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
              <div>
                <label className="label">Crop *</label>
                <select name="crop" value={form.crop} onChange={handleChange} className="input select capitalize">
                  <option value="">Select crop</option>
                  {CROP_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Year *</label>
                <input type="number" name="year" value={form.year} onChange={handleChange} min={2000} max={2100} className="input" />
              </div>
              <div>
                <label className="label">Yield (kg/ha) *</label>
                <input type="number" name="yield_kg_per_ha" value={form.yield_kg_per_ha} onChange={handleChange} placeholder="5000" className="input" />
              </div>
              <div>
                <label className="label">Area (ha)</label>
                <input type="number" name="area_ha" value={form.area_ha} onChange={handleChange} placeholder="5.0" className="input" />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Notes</label>
                <input type="text" name="notes" value={form.notes} onChange={handleChange} placeholder="Weather conditions, soil amendments, etc." className="input" />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={handleSave} disabled={saving} className="btn btn-primary">{saving ? 'Saving...' : 'Save Record'}</button>
              <button onClick={() => setShowForm(false)} className="btn btn-secondary">Cancel</button>
            </div>
          </div>
        )}

        {/* Trend Chart */}
        {chartData.length > 1 && (
          <div className="card mb-6" style={{ padding: '24px', borderColor: 'var(--color-border)' }}>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={16} style={{ color: 'var(--color-primary)' }} />
              <h2 className="section-title">Yield Trend Over Time</h2>
            </div>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="year" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}`} />
                  <Tooltip formatter={(v) => [`${v} kg/ha`, 'Avg Yield']} contentStyle={{ borderRadius: 12, fontSize: 12, background: 'var(--color-surface-dark)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />
                  <Line type="monotone" dataKey="avgYield" stroke="#22c55e" strokeWidth={2.5} dot={{ fill: '#22c55e', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Records Table */}
        {loading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 64, borderRadius: 'var(--radius-xl)' }} />)}</div>
        ) : records.length === 0 ? (
          <EmptyState
            icon={FolderOpen}
            title="No yield records yet"
            description="Track your harvest history by adding the first record."
            action={<button onClick={openNew} className="btn btn-primary"><Plus size={14} /> Add Record</button>}
          />
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th className="text-left">Crop</th>
                  <th className="text-right">Year</th>
                  <th className="text-right">Yield (kg/ha)</th>
                  <th className="text-right">Area (ha)</th>
                  <th className="text-left">Notes</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {records.map(r => (
                  <tr key={r.id}>
                    <td className="font-medium capitalize" style={{ color: 'var(--color-text)' }}>{r.crop}</td>
                    <td className="text-right" style={{ color: 'var(--color-text-muted)' }}>{r.year}</td>
                    <td className="text-right font-mono font-semibold" style={{ color: 'var(--color-primary)' }}>{parseFloat(r.yield_kg_per_ha).toLocaleString()}</td>
                    <td className="text-right" style={{ color: 'var(--color-text-muted)' }}>{r.area_ha ? parseFloat(r.area_ha).toLocaleString() : '—'}</td>
                    <td className="max-w-[180px] truncate" style={{ color: 'var(--color-text-muted)' }}>{r.notes || '—'}</td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(r)} className="btn btn-ghost btn-icon btn-sm" title="Edit"><Pencil size={13} /></button>
                        <button onClick={() => handleDelete(r.id)} className="btn btn-ghost btn-icon btn-sm" title="Delete" style={{ color: 'var(--color-danger)' }}><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}