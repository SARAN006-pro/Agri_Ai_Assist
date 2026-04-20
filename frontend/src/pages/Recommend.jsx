import { useState } from 'react'
import {
  Bar, BarChart, Cell, CartesianGrid,
  PolarAngleAxis, PolarGrid, PolarRadiusAxis,
  Radar, RadarChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from 'recharts'
import { Sprout, TrendingUp, BarChart3, RotateCcw, ArrowRight } from 'lucide-react'

import TopBar from '../components/TopBar'
import { predictCrop, predictYield } from '../services/api'

const DEFAULT_CROP = {
  nitrogen: 80, phosphorus: 40, potassium: 40,
  temperature: 25, humidity: 82, ph: 6.5, rainfall: 200,
}
const DEFAULT_YIELD = {
  crop_name: 'rice', area_hectares: 5,
  fertilizer_kg: 200, pesticide_kg: 10, annual_rainfall_mm: 1800,
}

const CROP_LIST = ['rice','wheat','maize','chickpea','kidneybeans','pigeonpeas','mothbeans','mungbean','blackgram','lentil','pomegranate','banana','mango','grapes','watermelon','muskmelon','apple','orange','papaya','coconut','cotton','jute','coffee']

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--color-surface-dark)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '10px 14px', fontSize: '0.8125rem', color: 'white', boxShadow: 'var(--shadow-xl)' }}>
      <p style={{ fontWeight: 600 }}>{label}</p>
      {payload.map((p, i) => <p key={i} style={{ color: p.color || p.fill }}>{p.name}: <strong>{typeof p.value === 'number' ? p.value.toFixed(1) : p.value}{p.unit || ''}</strong></p>)}
    </div>
  )
}

function RangeField({ label, name, value, onChange, min, max, step = 1, unit = '' }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="label">{label}</label>
        <span
          className="text-sm font-bold px-2.5 py-0.5 rounded-lg"
          style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--color-primary)', fontVariantNumeric: 'tabular-nums' }}
        >
          {typeof value === 'number' && step < 1 ? value.toFixed(1) : value}{unit}
        </span>
      </div>
      <input type="range" name={name} value={value} onChange={onChange} min={min} max={max} step={step} className="w-full" />
      <div className="flex justify-between text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  )
}

function TextField({ label, name, value, onChange, placeholder = '' }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="label">{label}</label>
      <input
        type="text"
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="input"
        style={{ textTransform: 'capitalize' }}
      />
    </div>
  )
}

function SelectField({ label, name, value, onChange, options }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="label">{label}</label>
      <select name={name} value={value} onChange={onChange} className="input select capitalize">
        {options.map(o => <option key={o} value={o} className="capitalize">{o}</option>)}
      </select>
    </div>
  )
}

const RESULT_COLORS = ['#10b981', '#6ee7b7', '#a7f3d0', '#d1fae5', '#ecfccb']

export default function Recommend() {
  const [tab, setTab] = useState('crop')
  const [cropForm, setCropForm] = useState(DEFAULT_CROP)
  const [yieldForm, setYieldForm] = useState(DEFAULT_YIELD)
  const [cropResult, setCropResult] = useState(null)
  const [yieldResult, setYieldResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleCrop = (e) => {
    const { name, value } = e.target
    setCropForm(prev => ({ ...prev, [name]: parseFloat(value) }))
  }

  const handleYield = (e) => {
    const { name, value } = e.target
    setYieldForm(prev => ({
      ...prev,
      [name]: name === 'crop_name' ? value : parseFloat(value),
    }))
  }

  const submitCrop = async () => {
    setLoading(true); setError('')
    try {
      const resp = await predictCrop(cropForm)
      setCropResult(resp.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Prediction failed. Please try again.')
    } finally { setLoading(false) }
  }

  const submitYield = async () => {
    setLoading(true); setError('')
    try {
      const resp = await predictYield(yieldForm)
      setYieldResult(resp.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Prediction failed. Please try again.')
    } finally { setLoading(false) }
  }

  const resetCrop = () => { setCropForm(DEFAULT_CROP); setCropResult(null); setError('') }
  const resetYield = () => { setYieldForm(DEFAULT_YIELD); setYieldResult(null); setError('') }

  const confidenceData = cropResult?.alternatives?.map((alt) => ({
    crop: alt.crop.charAt(0).toUpperCase() + alt.crop.slice(1),
    confidence: alt.confidence,
  })) ?? []

  const nutrientData = [
    { subject: 'Nitrogen', value: Math.min(100, (cropForm.nitrogen / 200) * 100) },
    { subject: 'Phosphorus', value: Math.min(100, (cropForm.phosphorus / 200) * 100) },
    { subject: 'Potassium', value: Math.min(100, (cropForm.potassium / 200) * 100) },
    { subject: 'Humidity', value: cropForm.humidity },
    { subject: 'Rainfall', value: Math.min(100, (cropForm.rainfall / 500) * 100) },
    { subject: 'pH', value: (cropForm.ph / 14) * 100 },
  ]

  return (
    <div className="flex-1 flex flex-col overflow-y-auto">
      <TopBar
        title="Crop Advisor"
        subtitle="AI-powered crop and yield recommendations for your farm"
      />

      {/* Tab Bar */}
      <div
        className="flex items-center gap-4 px-6 py-3 flex-wrap"
        style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface)' }}
      >
        <div className="tab-list">
          <button onClick={() => setTab('crop')} className={`tab-item ${tab === 'crop' ? 'active' : ''}`}>
            <Sprout size={14} strokeWidth={2} />
            Crop Recommendation
          </button>
          <button onClick={() => setTab('yield')} className={`tab-item ${tab === 'yield' ? 'active' : ''}`}>
            <TrendingUp size={14} strokeWidth={2} />
            Yield Prediction
          </button>
        </div>
        {tab === 'crop' && (
          <button onClick={resetCrop} className="btn btn-ghost btn-sm ml-auto" style={{ color: 'var(--color-text-muted)' }}>
            <RotateCcw size={13} /> Reset
          </button>
        )}
        {tab === 'yield' && (
          <button onClick={resetYield} className="btn btn-ghost btn-sm ml-auto" style={{ color: 'var(--color-text-muted)' }}>
            <RotateCcw size={13} /> Reset
          </button>
        )}
      </div>

      <div className="page-container">
        {/* ── Error Banner ─────────────────────────────────── */}
        {error && (
          <div className="alert alert-danger mb-6 animate-fade-up">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* ── Input Form ──────────────────────────────────── */}
          <div className="card" style={{ padding: '28px', borderColor: 'var(--color-border)' }}>
            <div className="flex items-center gap-2 mb-6">
              <div
                className="flex items-center justify-center rounded-xl"
                style={{ width: 38, height: 38, background: 'rgba(16,185,129,0.1)' }}
              >
                {tab === 'crop'
                  ? <Sprout size={18} style={{ color: 'var(--color-primary)' }} strokeWidth={2} />
                  : <BarChart3 size={18} style={{ color: 'var(--color-primary)' }} strokeWidth={2} />
                }
              </div>
              <div>
                <h2 className="section-title">
                  {tab === 'crop' ? 'Soil & Climate Inputs' : 'Farm Parameters'}
                </h2>
                <p className="section-subtitle">
                  {tab === 'crop' ? 'Adjust values to match your farm conditions' : 'Enter your crop and field details'}
                </p>
              </div>
            </div>

            {tab === 'crop' ? (
              <div className="flex flex-col gap-5">
                <RangeField label="Nitrogen (N)" name="nitrogen" value={cropForm.nitrogen} onChange={handleCrop} min={0} max={200} unit=" kg/ha" />
                <RangeField label="Phosphorus (P)" name="phosphorus" value={cropForm.phosphorus} onChange={handleCrop} min={0} max={200} unit=" kg/ha" />
                <RangeField label="Potassium (K)" name="potassium" value={cropForm.potassium} onChange={handleCrop} min={0} max={200} unit=" kg/ha" />
                <RangeField label="Temperature" name="temperature" value={cropForm.temperature} onChange={handleCrop} min={-10} max={50} unit="°C" />
                <RangeField label="Humidity" name="humidity" value={cropForm.humidity} onChange={handleCrop} min={0} max={100} unit="%" />
                <RangeField label="Soil pH" name="ph" value={cropForm.ph} onChange={handleCrop} min={0} max={14} step={0.1} />
                <RangeField label="Rainfall" name="rainfall" value={cropForm.rainfall} onChange={handleCrop} min={0} max={500} unit=" mm/mo" />
              </div>
            ) : (
              <div className="flex flex-col gap-5">
                <SelectField label="Crop" name="crop_name" value={yieldForm.crop_name} onChange={handleYield} options={CROP_LIST} />
                <RangeField label="Area" name="area_hectares" value={yieldForm.area_hectares} onChange={handleYield} min={0.1} max={10000} step={0.1} unit=" ha" />
                <RangeField label="Fertilizer" name="fertilizer_kg" value={yieldForm.fertilizer_kg} onChange={handleYield} min={0} max={1000} unit=" kg/ha" />
                <RangeField label="Pesticide" name="pesticide_kg" value={yieldForm.pesticide_kg} onChange={handleYield} min={0} max={100} unit=" kg/ha" />
                <RangeField label="Annual Rainfall" name="annual_rainfall_mm" value={yieldForm.annual_rainfall_mm} onChange={handleYield} min={0} max={5000} unit=" mm" />
              </div>
            )}

            <button
              onClick={tab === 'crop' ? submitCrop : submitYield}
              disabled={loading}
              className="btn btn-primary w-full mt-8"
              style={{ padding: '13px 24px', fontSize: '0.9375rem', borderRadius: 'var(--radius-lg)' }}
            >
              {loading ? (
                <>
                  <span className="spinner spinner-sm" />
                  Analysing...
                </>
              ) : (
                <>
                  {tab === 'crop' ? '🌱 Get Recommendation' : '📊 Predict Yield'}
                  {!loading && <ArrowRight size={16} />}
                </>
              )}
            </button>
          </div>

          {/* ── Result Panel ────────────────────────────────── */}
          <div className="card" style={{ padding: '28px', borderColor: 'var(--color-border)' }}>
            <h2 className="section-title mb-6">Result</h2>

            {/* Crop Result */}
            {tab === 'crop' && cropResult && (
              <div className="space-y-5 animate-fade-up">
                {/* Hero result */}
                <div className="text-center py-6 px-4 rounded-2xl" style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)' }}>
                  <div
                    className="flex items-center justify-center rounded-3xl mx-auto mb-4"
                    style={{ width: 72, height: 72, background: 'rgba(16,185,129,0.12)' }}
                  >
                    <Sprout size={32} style={{ color: 'var(--color-primary)' }} strokeWidth={1.5} />
                  </div>
                  <p className="text-4xl font-extrabold capitalize" style={{ color: 'var(--color-primary)', letterSpacing: '-0.03em' }}>
                    {cropResult.recommended_crop}
                  </p>
                  <div className="flex items-center justify-center gap-2 mt-2">
                    <span
                      className="badge badge-success"
                      style={{ fontSize: '0.8125rem', padding: '4px 14px' }}
                    >
                      {cropResult.confidence}% confidence
                    </span>
                  </div>
                </div>

                {/* Reason */}
                <div className="p-4 rounded-xl" style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
                  <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--color-text-muted)' }}>
                    Reasoning
                  </p>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                    {cropResult.reason}
                  </p>
                </div>

                {/* Alternatives */}
                {cropResult.alternatives && cropResult.alternatives.length > 1 && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--color-text-muted)' }}>
                      Alternatives
                    </p>
                    <div className="space-y-2">
                      {cropResult.alternatives.slice(1, 5).map((alt, i) => (
                        <div
                          key={alt.crop}
                          className="flex items-center justify-between p-3 rounded-xl"
                          style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className="text-xs font-bold w-5"
                              style={{ color: 'var(--color-text-muted)' }}
                            >
                              #{i + 2}
                            </span>
                            <span className="text-sm font-semibold capitalize" style={{ color: 'var(--color-text)' }}>
                              {alt.crop}
                            </span>
                          </div>
                          <span className="text-sm font-semibold" style={{ color: 'var(--color-text-muted)' }}>
                            {alt.confidence}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Yield Result */}
            {tab === 'yield' && yieldResult && (
              <div className="space-y-5 animate-fade-up">
                <div className="text-center py-6 px-4 rounded-2xl" style={{ background: 'rgba(14,165,233,0.06)', border: '1px solid rgba(14,165,233,0.15)' }}>
                  <div
                    className="flex items-center justify-center rounded-3xl mx-auto mb-4"
                    style={{ width: 72, height: 72, background: 'rgba(14,165,233,0.12)' }}
                  >
                    <BarChart3 size={32} style={{ color: '#0ea5e9' }} strokeWidth={1.5} />
                  </div>
                  <p
                    className="text-4xl font-extrabold"
                    style={{ color: '#0ea5e9', letterSpacing: '-0.03em' }}
                  >
                    {yieldResult.predicted_yield_kg_per_ha?.toLocaleString()} kg/ha
                  </p>
                  <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
                    Estimated yield per hectare
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Total Production', value: `${yieldResult.total_production_kg?.toLocaleString()} kg`, highlight: false },
                    { label: 'Crop', value: yieldResult.crop, highlight: false, capitalize: true },
                    { label: 'Area', value: `${yieldResult.area_hectares} ha`, highlight: false },
                  ].map(({ label, value, highlight, capitalize }) => (
                    <div
                      key={label}
                      className="text-center p-3 rounded-xl"
                      style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}
                    >
                      <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--color-text-muted)' }}>
                        {label}
                      </p>
                      <p
                        className="text-sm font-bold capitalize"
                        style={{ color: highlight ? 'var(--color-primary)' : 'var(--color-text)' }}
                      >
                        {capitalize ? String(value).toLowerCase() : value}
                      </p>
                    </div>
                  ))}
                </div>

                {yieldResult.note && (
                  <div className="alert alert-warning">
                    <span>💡</span>
                    <span className="text-sm">{yieldResult.note}</span>
                  </div>
                )}
              </div>
            )}

            {/* Empty state */}
            {!cropResult && !yieldResult && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center mb-5"
                  style={{ background: 'var(--color-surface-2)' }}
                >
                  {tab === 'crop'
                    ? <Sprout size={36} style={{ color: 'var(--color-text-muted)' }} strokeWidth={1} />
                    : <TrendingUp size={36} style={{ color: 'var(--color-text-muted)' }} strokeWidth={1} />
                  }
                </div>
                <p className="font-semibold text-sm mb-1" style={{ color: 'var(--color-text)' }}>
                  {tab === 'crop' ? 'No recommendation yet' : 'No prediction yet'}
                </p>
                <p className="text-xs max-w-xs leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
                  {tab === 'crop'
                    ? 'Adjust the soil and climate inputs on the left, then click Get Recommendation.'
                    : 'Fill in your farm parameters and click Predict Yield.'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Charts (Crop only, when result exists) ──────── */}
        {tab === 'crop' && cropResult && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mt-8">
            {/* Confidence bar chart */}
            <div className="card" style={{ padding: '24px', borderColor: 'var(--color-border)' }}>
              <h2 className="section-title mb-1">Confidence Scores</h2>
              <p className="section-subtitle mb-6">Comparison of top crop recommendations</p>
              <div style={{ height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={confidenceData} layout="vertical" margin={{ left: 20, right: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--color-border)" />
                    <XAxis
                      type="number" domain={[0, 100]}
                      tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
                      axisLine={false} tickLine={false}
                      tickFormatter={v => `${v}%`}
                    />
                    <YAxis
                      type="category" dataKey="crop"
                      tick={{ fontSize: 12, fill: 'var(--color-text-secondary)' }}
                      axisLine={false} tickLine={false} width={90}
                    />
                    <Tooltip content={<CustomTooltip />} formatter={(v) => [`${v}%`, 'Confidence']} />
                    <Bar dataKey="confidence" radius={[0, 8, 8, 0]} label={({ x, y, width, value }) => (
                      <text x={x + width + 6} y={y + 10} fill="var(--color-text-muted)" fontSize={11}>{value}%</text>
                    )}>
                      {confidenceData.map((_, i) => (
                        <Cell key={i} fill={RESULT_COLORS[i] || '#d1fae5'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Radar chart */}
            <div className="card" style={{ padding: '24px', borderColor: 'var(--color-border)' }}>
              <h2 className="section-title mb-1">Input Profile</h2>
              <p className="section-subtitle mb-6">Normalized values of your farm conditions</p>
              <div style={{ height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={nutrientData}>
                    <PolarGrid stroke="var(--color-border)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} tickCount={4} />
                    <Radar name="Your farm" dataKey="value" stroke="#10b981" fill="#10b981" fillOpacity={0.2} />
                    <Tooltip content={<CustomTooltip />} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
