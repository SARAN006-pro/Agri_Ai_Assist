import { Radio, Wifi, Copy, CheckCircle, AlertTriangle, Droplets, Thermometer, CloudRain, Activity } from 'lucide-react'
import { useEffect, useState } from 'react'
import TopBar from '../components/TopBar'
import { getSensorReadings, getWebhookUrl, sendSensorData } from '../services/api'

const SENSOR_TYPES = ['soil_moisture', 'temperature', 'humidity', 'rainfall', 'soil_ph']
const SENSOR_ICONS = {
  soil_moisture: Droplets,
  temperature: Thermometer,
  humidity: CloudRain,
  rainfall: CloudRain,
  soil_ph: Activity,
}
const SENSOR_LABELS = {
  soil_moisture: 'Soil Moisture',
  temperature: 'Temperature',
  humidity: 'Humidity',
  rainfall: 'Rainfall',
  soil_ph: 'Soil pH',
}
const SENSOR_UNITS = {
  soil_moisture: '%',
  temperature: '°C',
  humidity: '%',
  rainfall: 'mm',
  soil_ph: 'pH',
}

const THRESHOLDS = {
  soil_moisture: { min: 30, max: 80 },
  temperature: { min: 10, max: 40 },
  humidity: { min: 40, max: 85 },
  rainfall: { min: 0, max: 200 },
  soil_ph: { min: 5.5, max: 8.0 },
}

function isOutOfRange(type, value) {
  const t = THRESHOLDS[type]
  if (!t) return null
  if (value < t.min) return 'low'
  if (value > t.max) return 'high'
  return null
}

export default function Sensors() {
  const [readings, setReadings] = useState([])
  const [loading, setLoading] = useState(true)
  const [webhookUrl, setWebhookUrl] = useState('')
  const [copied, setCopied] = useState(false)
  const [filterType, setFilterType] = useState('')
  const [form, setForm] = useState({ sensor_type: 'soil_moisture', value: '', unit: '' })
  const [submitting, setSubmitting] = useState(false)
  const [submitMsg, setSubmitMsg] = useState('')

  useEffect(() => { loadAll() }, [filterType])

  const loadAll = async () => {
    setLoading(true)
    try {
      const [rResp, wResp] = await Promise.all([
        getSensorReadings(filterType ? { sensor_type: filterType } : {}),
        getWebhookUrl(),
      ])
      setReadings(rResp.data.readings || [])
      setWebhookUrl(wResp.data.webhook_url || '')
    } catch { setReadings([]) }
    finally { setLoading(false) }
  }

  const copyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.value) return
    setSubmitting(true)
    setSubmitMsg('')
    try {
      const unit = form.unit || SENSOR_UNITS[form.sensor_type] || ''
      await sendSensorData({ sensor_type: form.sensor_type, value: parseFloat(form.value), unit })
      setSubmitMsg('Sensor data submitted successfully!')
      setForm(f => ({ ...f, value: '', unit: '' }))
      loadAll()
    } catch {
      setSubmitMsg('Failed to submit sensor data.')
    } finally { setSubmitting(false) }
  }

  return (
    <div className="flex-1 flex flex-col overflow-y-auto">
      <TopBar title="IoT Sensors" subtitle="Real-time sensor data and webhook configuration" />
      <div className="page-container">

        {/* Webhook URL */}
        <div className="card mb-6" style={{ padding: '28px', borderColor: 'var(--color-border)' }}>
          <div className="flex items-center gap-2 mb-4">
            <div
              className="flex items-center justify-center rounded-xl"
              style={{ width: 38, height: 38, background: 'rgba(16,185,129,0.1)' }}
            >
              <Radio size={17} style={{ color: 'var(--color-primary)' }} strokeWidth={2} />
            </div>
            <div>
              <h2 className="section-title">Webhook Endpoint</h2>
              <p className="section-subtitle">Send sensor data from your IoT devices via HTTP POST</p>
            </div>
          </div>
          <p className="text-sm mb-4" style={{ color: 'var(--color-text-muted)' }}>
            Configure your IoT sensors to POST JSON to this endpoint.
          </p>
          <div className="flex items-center gap-3 mb-4">
            <code
              className="flex-1 text-sm font-mono px-4 py-3 rounded-xl break-all"
              style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-primary)' }}
            >
              {webhookUrl || 'https://your-backend-url/api/sensors/data'}
            </code>
            <button onClick={copyWebhook} className="btn btn-primary btn-icon flex-shrink-0">
              {copied ? <CheckCircle size={16} /> : <Copy size={16} />}
            </button>
          </div>
          <div
            className="p-4 rounded-xl"
            style={{ background: 'var(--color-info-bg)', border: '1px solid rgba(59,130,246,0.2)' }}
          >
            <p className="text-xs font-semibold mb-1" style={{ color: '#1d4ed8' }}>Payload format (JSON)</p>
            <p className="text-xs font-mono" style={{ color: '#1d4ed8' }}>{`{"sensor_type": "soil_moisture", "value": 45.5, "unit": "%", "farm_id": 1}`}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
          {/* Manual Submission Form */}
          <div className="card" style={{ padding: '28px', borderColor: 'var(--color-border)' }}>
            <h2 className="section-title mb-5">Manual Sensor Entry</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Sensor Type</label>
                <select value={form.sensor_type} onChange={e => setForm(f => ({ ...f, sensor_type: e.target.value, unit: '' }))} className="input select">
                  {SENSOR_TYPES.map(t => <option key={t} value={t}>{SENSOR_LABELS[t] || t}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Value</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="any"
                    value={form.value}
                    onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
                    placeholder="e.g. 45.5"
                    className="input"
                  />
                  <span
                    className="flex items-center px-3 rounded-xl text-sm font-medium"
                    style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}
                  >
                    {SENSOR_UNITS[form.sensor_type]}
                  </span>
                </div>
              </div>
              {form.value && isOutOfRange(form.sensor_type, parseFloat(form.value)) && (
                <div className="alert alert-warning">
                  <AlertTriangle size={16} />
                  <span>Value is outside normal range ({THRESHOLDS[form.sensor_type].min}–{THRESHOLDS[form.sensor_type].max})</span>
                </div>
              )}
              {submitMsg && (
                <div className={`alert ${submitMsg.includes('success') ? 'alert-success' : 'alert-danger'}`}>
                  <span>{submitMsg}</span>
                </div>
              )}
              <button type="submit" disabled={submitting || !form.value} className="btn btn-primary w-full">
                {submitting ? 'Submitting...' : 'Submit Reading'}
              </button>
            </form>
          </div>

          {/* Current Readings Summary */}
          <div className="card" style={{ padding: '28px', borderColor: 'var(--color-border)' }}>
            <h2 className="section-title mb-5">Latest Readings</h2>
            {loading ? (
              <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 64, borderRadius: 'var(--radius-xl)' }} />)}</div>
            ) : readings.length === 0 ? (
              <p className="text-sm text-center py-10" style={{ color: 'var(--color-text-muted)' }}>No sensor readings yet. Submit data from your IoT device.</p>
            ) : (
              <div className="space-y-3">
                {readings.slice(0, 8).map(r => {
                  const range = isOutOfRange(r.sensor_type, r.value)
                  const Icon = SENSOR_ICONS[r.sensor_type] || Activity
                  return (
                    <div
                      key={r.id}
                      className="flex items-center gap-3 p-3 rounded-xl"
                      style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}
                    >
                      <div
                        className="flex items-center justify-center rounded-xl flex-shrink-0"
                        style={{
                          width: 36, height: 36,
                          background: range ? 'var(--color-danger-bg)' : 'rgba(16,185,129,0.1)',
                        }}
                      >
                        <Icon
                          size={16}
                          style={{ color: range ? '#b91c1c' : 'var(--color-primary)' }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{SENSOR_LABELS[r.sensor_type] || r.sensor_type}</p>
                        <p className="font-semibold" style={{ color: 'var(--color-text)' }}>
                          {r.value} <span className="text-xs font-normal" style={{ color: 'var(--color-text-muted)' }}>{r.unit}</span>
                        </p>
                      </div>
                      {range && (
                        <span className="badge badge-danger capitalize">
                          <AlertTriangle size={10} /> {range}
                        </span>
                      )}
                      <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        {new Date(r.timestamp).toLocaleString()}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* All Readings Table */}
        <div className="card" style={{ padding: '24px', borderColor: 'var(--color-border)' }}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="section-title">All Readings</h2>
            <div className="flex items-center gap-2">
              <select value={filterType} onChange={e => setFilterType(e.target.value)} className="input select" style={{ width: 140, padding: '6px 12px', fontSize: '0.8125rem' }}>
                <option value="">All types</option>
                {SENSOR_TYPES.map(t => <option key={t} value={t}>{SENSOR_LABELS[t] || t}</option>)}
              </select>
              <button onClick={loadAll} className="btn btn-secondary btn-sm">Refresh</button>
            </div>
          </div>
          {loading ? (
            <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 40, borderRadius: 'var(--radius-md)' }} />)}</div>
          ) : readings.length === 0 ? (
            <p className="text-sm text-center py-10" style={{ color: 'var(--color-text-muted)' }}>No readings found for this filter.</p>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th className="text-left">Timestamp</th>
                    <th className="text-left">Type</th>
                    <th className="text-right">Value</th>
                    <th className="text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {readings.map(r => {
                    const range = isOutOfRange(r.sensor_type, r.value)
                    return (
                      <tr key={r.id}>
                        <td className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{new Date(r.timestamp).toLocaleString()}</td>
                        <td className="capitalize font-medium" style={{ color: 'var(--color-text-secondary)' }}>{SENSOR_LABELS[r.sensor_type] || r.sensor_type}</td>
                        <td className="text-right font-mono" style={{ color: 'var(--color-text)' }}>
                          {r.value} <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{r.unit}</span>
                        </td>
                        <td>
                          {range ? (
                            <span className="badge badge-danger">
                              <AlertTriangle size={10} /> Out of range
                            </span>
                          ) : (
                            <span className="badge badge-success">
                              <CheckCircle size={10} /> Normal
                            </span>
                          )}
                        </td>
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