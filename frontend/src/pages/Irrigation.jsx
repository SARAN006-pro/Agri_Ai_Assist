import { Droplets, AlertTriangle, CheckCircle, Clock } from 'lucide-react'
import { useEffect, useState } from 'react'
import TopBar from '../components/TopBar'
import { getIrrigationAdvice, getIrrigationLogs } from '../services/api'

const CROP_OPTIONS = ['Rice', 'Wheat', 'Maize', 'Tomato', 'Potato', 'Onion', 'Soybean', 'Cotton', 'Sugarcane', 'Groundnut', 'Sunflower', 'Chilli', 'Turmeric', 'Coffee', 'Tea', 'Banana', 'Mango']

const URGENCY_CONFIG = {
  low: { icon: CheckCircle, color: 'emerald', bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-200/70 dark:border-emerald-500/20', text: 'text-emerald-700 dark:text-emerald-300' },
  medium: { icon: Clock, color: 'amber', bg: 'bg-amber-50 dark:bg-amber-500/10', border: 'border-amber-200/70 dark:border-amber-500/20', text: 'text-amber-700 dark:text-amber-300' },
  high: { icon: AlertTriangle, color: 'rose', bg: 'bg-rose-50 dark:bg-rose-500/10', border: 'border-rose-200/70 dark:border-rose-500/20', text: 'text-rose-700 dark:text-rose-300' },
}

export default function Irrigation() {
  const [form, setForm] = useState({ soil_moisture: 50, crop: 'Rice', temperature: '', humidity: '' })
  const [advice, setAdvice] = useState(null)
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(false)
  const [logLoading, setLogLoading] = useState(true)

  useEffect(() => { loadLogs() }, [])

  const loadLogs = async () => {
    setLogLoading(true)
    try {
      const resp = await getIrrigationLogs({ limit: 20 })
      setLogs(resp.data.logs || [])
    } catch { setLogs([]) }
    finally { setLogLoading(false) }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: name === 'crop' ? value : parseFloat(value) }))
  }

  const submit = async () => {
    setLoading(true)
    try {
      const payload = { soil_moisture: form.soil_moisture, crop: form.crop }
      if (form.temperature !== '') payload.temperature = form.temperature
      if (form.humidity !== '') payload.humidity = form.humidity
      const resp = await getIrrigationAdvice(payload)
      setAdvice(resp.data)
      loadLogs()
    } catch { setAdvice({ error: 'Failed to get irrigation advice' }) }
    finally { setLoading(false) }
  }

  const uc = advice?.urgency ? URGENCY_CONFIG[advice.urgency] : null
  const UrgencyIcon = uc?.icon

  return (
    <div className="flex-1 flex flex-col overflow-y-auto">
      <TopBar title="Irrigation Advisor" subtitle="Smart water management recommendations" />
      <div className="page-container">

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Input Form */}
          <div className="card" style={{ padding: '28px', borderColor: 'var(--color-border)' }}>
            <div className="flex items-center gap-2 mb-5">
              <div
                className="flex items-center justify-center rounded-xl"
                style={{ width: 38, height: 38, background: 'rgba(16,185,129,0.1)' }}
              >
                <Droplets size={17} style={{ color: 'var(--color-primary)' }} strokeWidth={2} />
              </div>
              <div>
                <h2 className="section-title">Soil &amp; Crop Inputs</h2>
                <p className="section-subtitle">Enter current conditions for advice</p>
              </div>
            </div>
            <div className="space-y-5">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="label">Soil Moisture</label>
                  <span
                    className="text-sm font-bold px-2.5 py-0.5 rounded-lg"
                    style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--color-primary)' }}
                  >
                    {form.soil_moisture}%
                  </span>
                </div>
                <input type="range" name="soil_moisture" value={form.soil_moisture} onChange={handleChange} min={0} max={100} step={1} className="w-full" />
                <div className="flex justify-between text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                  <span>0% (dry)</span><span>100% (saturated)</span>
                </div>
              </div>
              <div>
                <label className="label">Crop</label>
                <select name="crop" value={form.crop} onChange={handleChange} className="input select">
                  {CROP_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Temperature (°C)</label>
                  <input type="number" name="temperature" value={form.temperature} onChange={handleChange} placeholder="Optional" className="input" />
                </div>
                <div>
                  <label className="label">Humidity (%)</label>
                  <input type="number" name="humidity" value={form.humidity} onChange={handleChange} placeholder="Optional" className="input" />
                </div>
              </div>
              <button onClick={submit} disabled={loading} className="btn btn-primary w-full mt-2">
                {loading ? <><span className="spinner spinner-sm" />Analysing...</> : 'Get Irrigation Advice'}
              </button>
            </div>
          </div>

          {/* Advice Result */}
          <div className="card" style={{ padding: '28px', borderColor: 'var(--color-border)' }}>
            <div className="flex items-center gap-2 mb-5">
              <div
                className="flex items-center justify-center rounded-xl"
                style={{ width: 38, height: 38, background: 'rgba(16,185,129,0.1)' }}
              >
                <Droplets size={17} style={{ color: 'var(--color-primary)' }} strokeWidth={2} />
              </div>
              <div>
                <h2 className="section-title">Recommendation</h2>
                <p className="section-subtitle">AI-generated irrigation advice</p>
              </div>
            </div>
            {advice?.error ? (
              <div className="alert alert-danger"><span>⚠️</span><span>{advice.error}</span></div>
            ) : advice ? (
              <div className="space-y-4">
                {uc && (
                  <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${uc.bg} ${uc.border}`}>
                    <UrgencyIcon size={20} className={uc.text} />
                    <span className={`text-sm font-semibold capitalize ${uc.text}`}>{advice.urgency} urgency</span>
                  </div>
                )}
                <div
                  className="p-4 rounded-xl"
                  style={{ background: 'var(--color-info-bg)', border: '1px solid rgba(59,130,246,0.2)' }}
                >
                  <p className="text-sm leading-relaxed" style={{ color: '#1d4ed8' }}>{advice.recommendation}</p>
                </div>
                <div className="p-4 rounded-xl" style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--color-text-muted)' }}>Recommended Action</p>
                  <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{advice.action}</p>
                </div>
                <div className="flex items-center justify-between text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  <span>Soil: {advice.soil_moisture}%</span>
                  <span>Crop: {advice.crop}</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                  style={{ background: 'var(--color-surface-2)' }}
                >
                  <Droplets size={28} style={{ color: 'var(--color-text-muted)' }} strokeWidth={1.5} />
                </div>
                <p className="font-semibold text-sm mb-1" style={{ color: 'var(--color-text)' }}>No advice yet</p>
                <p className="text-xs max-w-xs leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
                  Enter soil data and click Get Irrigation Advice to see recommendations
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Irrigation Log History */}
        <div className="card mt-6" style={{ padding: '24px', borderColor: 'var(--color-border)' }}>
          <h2 className="section-title mb-5">Recent Irrigation Log</h2>
          {logLoading ? (
            <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 48, borderRadius: 'var(--radius-md)' }} />)}</div>
          ) : logs.length === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: 'var(--color-text-muted)' }}>No irrigation logs yet. Submit an advice request to create one.</p>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th className="text-left">Date</th>
                    <th className="text-left">Crop</th>
                    <th className="text-right">Moisture</th>
                    <th className="text-left">Urgency</th>
                    <th className="text-left">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map(log => {
                    const logUc = URGENCY_CONFIG[log.urgency] || URGENCY_CONFIG.low
                    return (
                      <tr key={log.id}>
                        <td style={{ color: 'var(--color-text-muted)' }}>{new Date(log.created_at).toLocaleDateString()}</td>
                        <td className="capitalize font-medium" style={{ color: 'var(--color-text-secondary)' }}>{log.crop}</td>
                        <td className="text-right font-mono font-semibold" style={{ color: 'var(--color-primary)' }}>{log.moisture_level}%</td>
                        <td>
                          <span className={`badge badge-${log.urgency === 'high' ? 'danger' : log.urgency === 'medium' ? 'warning' : 'success'}`}>{log.urgency}</span>
                        </td>
                        <td className="max-w-[200px] truncate" style={{ color: 'var(--color-text-muted)' }}>{log.recommended_action}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}