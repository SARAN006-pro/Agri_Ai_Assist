import { TrendingUp, TrendingDown } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import EmptyState from '../components/EmptyState'
import TopBar from '../components/TopBar'
import { getMarketPrices } from '../services/api'

const MARKET_COLORS = {
  'Wholesale': '#3b82f6',
  'Retail': '#22c55e',
  'Farm Gate': '#f59e0b',
}

const MARKET_LIST = ['Wholesale', 'Retail', 'Farm Gate']

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--color-surface-dark)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '10px 14px', fontSize: '0.8125rem', color: 'white', boxShadow: 'var(--shadow-xl)' }}>
      <p style={{ fontWeight: 600 }}>{label}</p>
      {payload.map((p, i) => <p key={i} style={{ color: p.fill }}>{p.name}: <strong>₹{Number(p.value).toFixed(2)}/kg</strong></p>)}
    </div>
  )
}

export default function Market() {
  const [prices, setPrices] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCrop, setSelectedCrop] = useState('')
  const [sortKey, setSortKey] = useState('crop')
  const [sortDir, setSortDir] = useState('asc')

  useEffect(() => { loadPrices() }, [])

  const loadPrices = async () => {
    setLoading(true)
    try {
      const resp = await getMarketPrices()
      const data = resp.data.prices || []
      setPrices(data)
      if (data.length > 0 && !selectedCrop) setSelectedCrop(data[0].crop)
    } catch { setPrices([]) }
    finally { setLoading(false) }
  }

  const crops = [...new Map(prices.map(p => [p.crop, p.crop])).values()].sort()

  const filtered = prices.filter(p => !selectedCrop || p.crop === selectedCrop)
  const sorted = [...filtered].sort((a, b) => {
    const av = a[sortKey] || ''
    const bv = b[sortKey] || ''
    return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
  })

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  const trendData = selectedCrop
    ? prices.filter(p => p.crop === selectedCrop).map(p => ({ market: p.market, price: p.price_per_kg }))
    : []

  // Calculate price stats
  const selectedPrices = prices.filter(p => p.crop === selectedCrop)
  const avgPrice = selectedPrices.length > 0
    ? (selectedPrices.reduce((s, p) => s + p.price_per_kg, 0) / selectedPrices.length).toFixed(2)
    : null
  const maxPrice = selectedPrices.length > 0 ? Math.max(...selectedPrices.map(p => p.price_per_kg)) : null
  const minPrice = selectedPrices.length > 0 ? Math.min(...selectedPrices.map(p => p.price_per_kg)) : null

  return (
    <div className="flex-1 flex flex-col overflow-y-auto">
      <TopBar title="Market Prices" subtitle="Live crop price trends across markets" />

      <div className="page-container">
        {/* Stats row */}
        {selectedCrop && avgPrice && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { label: 'Avg Price', value: `₹${avgPrice}`, sub: 'per kg', color: 'var(--color-primary)' },
              { label: 'Highest', value: `₹${maxPrice?.toFixed(2)}`, sub: 'per kg', color: '#3b82f6' },
              { label: 'Lowest', value: `₹${minPrice?.toFixed(2)}`, sub: 'per kg', color: '#f59e0b' },
            ].map(({ label, value, sub, color }) => (
              <div key={label} className="card text-center" style={{ padding: '20px', borderColor: 'var(--color-border)' }}>
                <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--color-text-muted)' }}>{label}</p>
                <p className="text-2xl font-extrabold" style={{ color }}>{value}</p>
                <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>{sub}</p>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Price Table */}
          <div className="xl:col-span-2 card" style={{ padding: '24px', borderColor: 'var(--color-border)' }}>
            <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
              <div>
                <h2 className="section-title">Price Overview</h2>
                <p className="section-subtitle">{filtered.length} market entries</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Filter:</span>
                <select
                  value={selectedCrop}
                  onChange={e => setSelectedCrop(e.target.value)}
                  className="input select"
                  style={{ width: 140, paddingTop: 6, paddingBottom: 6, fontSize: '0.8125rem' }}
                >
                  <option value="">All crops</option>
                  {crops.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {loading ? (
              <div className="space-y-3">{[1,2,3,4,5].map(i => <div key={i} className="skeleton" style={{ height: 48, borderRadius: 12 }} />)}</div>
            ) : sorted.length === 0 ? (
              <EmptyState icon={null} title="No price data" description="Market prices will appear here once loaded." />
            ) : (
              <div className="table-container border-0 shadow-none">
                <table>
                  <thead>
                    <tr>
                      {[['crop','Crop'],['market','Market Type'],['price_per_kg','Price/kg'],['date','Date']].map(([col, label]) => (
                        <th
                          key={col}
                          onClick={() => handleSort(col)}
                          className="cursor-pointer select-none"
                        >
                          <span className="flex items-center gap-1 justify-start">
                            {label}
                            {sortKey === col && (
                              sortDir === 'asc' ? <TrendingUp size={11} /> : <TrendingDown size={11} />
                            )}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sorted.map((row, i) => (
                      <tr key={i} className="transition-colors duration-100">
                        <td className="font-semibold capitalize" style={{ color: 'var(--color-text)' }}>{row.crop}</td>
                        <td>
                          <span
                            className="badge"
                            style={{
                              background: `${MARKET_COLORS[row.market] || '#94a3b8'}15`,
                              color: MARKET_COLORS[row.market] || '#94a3b8',
                              borderColor: `${MARKET_COLORS[row.market] || '#94a3b8'}30`,
                              border: '1px solid',
                            }}
                          >
                            {row.market}
                          </span>
                        </td>
                        <td className="font-mono font-bold" style={{ color: 'var(--color-primary)' }}>
                          ₹{row.price_per_kg.toFixed(2)}
                        </td>
                        <td style={{ color: 'var(--color-text-muted)' }}>{row.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Bar Chart */}
          {selectedCrop && trendData.length > 0 && (
            <div className="card" style={{ padding: '24px', borderColor: 'var(--color-border)' }}>
              <div className="mb-5">
                <h2 className="section-title capitalize">{selectedCrop}</h2>
                <p className="section-subtitle">Price comparison by market type</p>
              </div>
              <div style={{ height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trendData} layout="vertical" margin={{ left: 10, right: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--color-border)" />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
                      axisLine={false} tickLine={false}
                      tickFormatter={v => `₹${v}`}
                    />
                    <YAxis
                      type="category" dataKey="market"
                      tick={{ fontSize: 12, fill: 'var(--color-text-secondary)' }}
                      axisLine={false} tickLine={false} width={80}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="price" radius={[0, 8, 8, 0]} label={({ x, y, width, value }) => (
                      <text x={x + width + 6} y={y + 12} fill="var(--color-text-muted)" fontSize={12} fontWeight={600}>₹{value}</text>
                    )}>
                      {trendData.map((_, i) => (
                        <Cell key={i} fill={Object.values(MARKET_COLORS)[i % 3]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex gap-4 justify-center mt-4">
                {MARKET_LIST.map(m => (
                  <div key={m} className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    <span className="w-3 h-3 rounded-full" style={{ background: MARKET_COLORS[m] }} />
                    {m}
                  </div>
                ))}
              </div>
            </div>
          )}

          {(!selectedCrop || trendData.length === 0) && (
            <div className="card flex flex-col items-center justify-center text-center" style={{ padding: 40, borderColor: 'var(--color-border)' }}>
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                style={{ background: 'var(--color-surface-3)' }}
              >
                <TrendingUp size={28} style={{ color: 'var(--color-text-muted)' }} strokeWidth={1.5} />
              </div>
              <p className="font-semibold text-sm mb-1" style={{ color: 'var(--color-text)' }}>Select a crop to see price chart</p>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Use the dropdown above to filter by crop</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
