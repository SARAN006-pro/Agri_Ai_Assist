import { DollarSign, TrendingUp, TrendingDown, Calculator } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import TopBar from '../components/TopBar'
import { getProfitMargin, getMarketPrices, getCropsList } from '../services/api'

const INITIAL_FORM = {
  crop: 'rice',
  area_ha: 5,
  fertilizer_cost: 10000,
  pesticide_cost: 3000,
  labor_cost: 8000,
  expected_yield_kg: 5000,
  price_per_kg: 25,
}

export default function Economics() {
  const [form, setForm] = useState(INITIAL_FORM)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [crops, setCrops] = useState([])
  const [priceHint, setPriceHint] = useState('')

  useEffect(() => { loadCrops() }, [])

  const loadCrops = async () => {
    try {
      const resp = await getCropsList()
      setCrops(resp.data.crops || [])
    } catch { setCrops([]) }
  }

  const loadMarketPrice = async (cropName) => {
    if (!cropName) return
    try {
      const resp = await getMarketPrices()
      const prices = resp.data.prices || []
      const avg = prices.filter(p => p.crop.toLowerCase() === cropName.toLowerCase())
      if (avg.length > 0) {
        const avgp = (avg.reduce((s, p) => s + p.price_per_kg, 0) / avg.length).toFixed(2)
        setPriceHint(`Market avg: ₹${avgp}/kg`)
      } else {
        setPriceHint('')
      }
    } catch { setPriceHint('') }
  }

  const handleCropChange = (e) => {
    const val = e.target.value
    setForm(f => ({ ...f, crop: val }))
    loadMarketPrice(val)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: parseFloat(value) }))
  }

  const submit = async () => {
    setLoading(true)
    try {
      const resp = await getProfitMargin(form)
      setResult(resp.data)
    } catch { setResult({ error: 'Calculation failed' }) }
    finally { setLoading(false) }
  }

  const costData = result ? [
    { name: 'Fertilizer', value: result.breakdown.fertilizer_cost },
    { name: 'Pesticide', value: result.breakdown.pesticide_cost },
    { name: 'Labor', value: result.breakdown.labor_cost },
  ] : []

  const isProfitable = result && result.profit_margin > 0

  return (
    <div className="flex-1 flex flex-col overflow-y-auto">
      <TopBar title="Profit Margin Calculator" subtitle="Estimate revenue and costs for your crop" />
      <div className="page-container">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Input Form */}
          <div className="card" style={{ padding: '28px', borderColor: 'var(--color-border)' }}>
            <div className="flex items-center gap-2 mb-5">
              <div
                className="flex items-center justify-center rounded-xl"
                style={{ width: 38, height: 38, background: 'rgba(16,185,129,0.1)' }}
              >
                <DollarSign size={17} style={{ color: 'var(--color-primary)' }} strokeWidth={2} />
              </div>
              <div>
                <h2 className="section-title">Cost &amp; Revenue Inputs</h2>
                <p className="section-subtitle">Enter your crop production costs</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Crop</label>
                  <select name="crop" value={form.crop} onChange={handleCropChange} className="input select capitalize">
                    {crops.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  {priceHint && <p className="text-xs mt-1" style={{ color: 'var(--color-primary)' }}>{priceHint}</p>}
                </div>
                <div>
                  <label className="label">Area (ha)</label>
                  <input type="number" name="area_ha" value={form.area_ha} onChange={handleChange} min={0.1} step={0.1} className="input" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Fertilizer Cost (₹)</label>
                  <input type="number" name="fertilizer_cost" value={form.fertilizer_cost} onChange={handleChange} className="input" />
                </div>
                <div>
                  <label className="label">Pesticide Cost (₹)</label>
                  <input type="number" name="pesticide_cost" value={form.pesticide_cost} onChange={handleChange} className="input" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Labor Cost (₹)</label>
                  <input type="number" name="labor_cost" value={form.labor_cost} onChange={handleChange} className="input" />
                </div>
                <div>
                  <label className="label">Price per kg (₹)</label>
                  <input type="number" name="price_per_kg" value={form.price_per_kg} onChange={handleChange} step={0.5} className="input" />
                </div>
              </div>
              <div>
                <label className="label">Expected Yield (kg)</label>
                <input type="number" name="expected_yield_kg" value={form.expected_yield_kg} onChange={handleChange} className="input" />
              </div>
              <button onClick={submit} disabled={loading} className="btn btn-primary w-full mt-2">
                <Calculator size={16} /> {loading ? 'Calculating...' : 'Calculate Profit'}
              </button>
            </div>
          </div>

          {/* Results */}
          <div className="card" style={{ padding: '28px', borderColor: 'var(--color-border)' }}>
            <div className="flex items-center gap-2 mb-5">
              <div
                className="flex items-center justify-center rounded-xl"
                style={{ width: 38, height: 38, background: 'rgba(16,185,129,0.1)' }}
              >
                <TrendingUp size={17} style={{ color: 'var(--color-primary)' }} strokeWidth={2} />
              </div>
              <div>
                <h2 className="section-title">Results</h2>
                <p className="section-subtitle">Profit analysis for your crop</p>
              </div>
            </div>
            {result?.error ? (
              <div className="alert alert-danger"><span>⚠️</span><span>{result.error}</span></div>
            ) : result ? (
              <div className="space-y-5">
                {/* Summary cards */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-3 rounded-xl" style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
                    <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--color-text-muted)' }}>Total Cost</p>
                    <p className="font-bold" style={{ fontSize: '1rem', color: 'var(--color-text)' }}>₹{result.total_cost.toLocaleString()}</p>
                  </div>
                  <div className="text-center p-3 rounded-xl" style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
                    <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--color-text-muted)' }}>Revenue</p>
                    <p className="font-bold" style={{ fontSize: '1rem', color: '#0ea5e9' }}>₹{result.total_revenue.toLocaleString()}</p>
                  </div>
                  <div
                    className="text-center p-3 rounded-xl"
                    style={{
                      background: isProfitable ? 'var(--color-success-bg)' : 'var(--color-danger-bg)',
                      border: `1px solid ${isProfitable ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
                    }}
                  >
                    <p
                      className="text-[10px] font-bold uppercase tracking-widest mb-1"
                      style={{ color: isProfitable ? '#15803d' : '#b91c1c' }}
                    >
                      Profit
                    </p>
                    <p
                      className="font-bold"
                      style={{ fontSize: '1rem', color: isProfitable ? '#15803d' : '#b91c1c' }}
                    >
                      ₹{result.profit_margin.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Profit margin % */}
                <div
                  className="flex items-center justify-center gap-3 px-6 py-4 rounded-2xl"
                  style={{
                    background: isProfitable ? 'var(--color-success-bg)' : 'var(--color-danger-bg)',
                    border: `1px solid ${isProfitable ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
                  }}
                >
                  {isProfitable ? <TrendingUp size={24} style={{ color: '#15803d' }} /> : <TrendingDown size={24} style={{ color: '#b91c1c' }} />}
                  <div className="text-center">
                    <p
                      className="font-extrabold"
                      style={{ fontSize: '1.875rem', color: isProfitable ? '#15803d' : '#b91c1c' }}
                    >
                      {result.profit_margin_pct}%
                    </p>
                    <p
                      className="text-xs"
                      style={{ color: isProfitable ? '#15803d' : '#b91c1c' }}
                    >
                      Profit Margin
                    </p>
                  </div>
                </div>

                {/* Cost breakdown */}
                {costData.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--color-text-muted)' }}>Cost Breakdown</p>
                    <div className="grid grid-cols-3 gap-3">
                      {costData.map((d, i) => (
                        <div key={d.name} className="rounded-xl p-3 text-center" style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
                          <span className="mx-auto mb-2 block w-3 h-3 rounded-full" style={{ background: ['#3b82f6', '#22c55e', '#f59e0b'][i] }} />
                          <p className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>{d.name}</p>
                          <p className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>₹{d.value.toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Cost vs Revenue */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--color-text-muted)' }}>Cost vs Revenue</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl p-4" style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
                      <p className="text-xs font-medium mb-1" style={{ color: 'var(--color-text-muted)' }}>Total Cost</p>
                      <p className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>₹{result.total_cost.toLocaleString()}</p>
                    </div>
                    <div className="rounded-xl p-4" style={{ background: isProfitable ? 'var(--color-success-bg)' : 'var(--color-warning-bg)', border: `1px solid ${isProfitable ? 'rgba(34,197,94,0.2)' : 'rgba(245,158,11,0.2)'}` }}>
                      <p className="text-xs font-medium mb-1" style={{ color: isProfitable ? '#15803d' : '#b45309' }}>Profit</p>
                      <p className="text-lg font-bold" style={{ color: isProfitable ? '#15803d' : '#b45309' }}>₹{Math.max(0, result.profit_margin).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                  style={{ background: 'var(--color-surface-2)' }}
                >
                  <DollarSign size={28} style={{ color: 'var(--color-text-muted)' }} strokeWidth={1.5} />
                </div>
                <p className="font-semibold text-sm mb-1" style={{ color: 'var(--color-text)' }}>No calculation yet</p>
                <p className="text-xs max-w-xs leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
                  Fill in the costs and click Calculate Profit to see the breakdown
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}