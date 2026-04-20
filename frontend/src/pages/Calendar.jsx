import { useEffect, useState } from 'react'
import { Calendar, MapPin } from 'lucide-react'
import EmptyState from '../components/EmptyState'
import TopBar from '../components/TopBar'
import { getCalendar } from '../services/api'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const STATUS_COLORS = {
  'planting':   { bg: '#22c55e', light: 'rgba(34,197,94,0.15)', label: 'Planting',   text: '#15803d' },
  'harvesting': { bg: '#f59e0b', light: 'rgba(245,158,11,0.15)', label: 'Harvesting', text: '#b45309' },
  'growing':    { bg: '#3b82f6', light: 'rgba(59,130,246,0.15)', label: 'Growing',    text: '#1d4ed8' },
  'off-season': { bg: '#94a3b8', light: 'rgba(148,163,184,0.15)', label: 'Off-season', text: '#64748b' },
}

const STATUS_KEYS = ['planting', 'harvesting', 'growing', 'off-season']

export default function CalendarPage() {
  const [crops, setCrops] = useState([])
  const [loading, setLoading] = useState(true)
  const [location, setLocation] = useState('')

  useEffect(() => { loadCalendar() }, [location])

  const loadCalendar = async () => {
    setLoading(true)
    try {
      const resp = await getCalendar(location)
      setCrops(resp.data.crops || [])
    } catch { setCrops([]) }
    finally { setLoading(false) }
  }

  const currentMonth = new Date().getMonth() + 1
  const currentYear = new Date().getFullYear()

  return (
    <div className="flex-1 flex flex-col overflow-y-auto">
      <TopBar title="Crop Calendar" subtitle="Seasonal planting and harvest timeline" />

      <div className="page-container">
        {/* Location Filter */}
        <div className="card mb-6" style={{ padding: '16px 20px', borderColor: 'var(--color-border)' }}>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <MapPin size={15} style={{ color: 'var(--color-text-muted)' }} strokeWidth={2} />
              <span className="text-xs font-semibold" style={{ color: 'var(--color-text-muted)' }}>Location filter</span>
            </div>
            <input
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="e.g. Tamil Nadu (optional)"
              className="input"
              style={{ maxWidth: 240, fontSize: '0.8125rem', padding: '7px 12px' }}
            />
          </div>
        </div>

        {/* Timeline Grid */}
        <div className="card mb-6" style={{ padding: '24px', borderColor: 'var(--color-border)' }}>
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <div>
              <h2 className="section-title">12-Month Crop Timeline</h2>
              <p className="section-subtitle">{currentYear} — coloured bars show active periods</p>
            </div>
            <div
              className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold"
              style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: 'var(--color-primary)' }}
            >
              <span className="w-2 h-2 rounded-full animate-pulse-dot" style={{ background: 'var(--color-primary)' }} />
              Today: {MONTHS[currentMonth - 1]} {currentYear}
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 48, borderRadius: 12 }} />)}</div>
          ) : crops.length === 0 ? (
            <EmptyState icon={Calendar} title="No calendar data" description="Crop calendar will appear here." />
          ) : (
            <div style={{ minWidth: 700, overflowX: 'auto' }}>
              {/* Month headers */}
              <div
                className="grid gap-1 mb-2"
                style={{ gridTemplateColumns: '180px repeat(12, 1fr)' }}
              >
                <div />
                {MONTHS.map(m => (
                  <div
                    key={m}
                    className="text-center text-[11px] font-bold uppercase py-2 rounded-lg transition-colors"
                    style={{
                      color: MONTHS.indexOf(m) + 1 === currentMonth ? 'var(--color-primary)' : 'var(--color-text-muted)',
                      background: MONTHS.indexOf(m) + 1 === currentMonth ? 'rgba(16,185,129,0.1)' : 'transparent',
                      letterSpacing: '0.05em',
                    }}
                  >
                    {m}
                  </div>
                ))}
              </div>

              {/* Crop rows */}
              <div className="space-y-1.5">
                {crops.map(crop => {
                  const pm = crop.planting_month
                  const hm = crop.harvest_month
                  const start = pm - 1
                  const end = hm - 1

                  let bars = []
                  if (start <= end) {
                    bars = Array.from({ length: end - start + 1 }, (_, i) => start + i)
                  } else {
                    bars = [
                      ...Array.from({ length: 12 - start }, (_, i) => start + i),
                      ...Array.from({ length: end + 1 }, (_, i) => i),
                    ]
                  }

                  const sc = STATUS_COLORS[crop.status] || STATUS_COLORS['off-season']

                  return (
                    <div
                      key={crop.name}
                      className="grid gap-1 items-center"
                      style={{ gridTemplateColumns: '180px repeat(12, 1fr)' }}
                    >
                      <div className="flex items-center gap-2 pr-3">
                        <span className="text-xs font-semibold truncate" style={{ color: 'var(--color-text-secondary)' }}>
                          {crop.name}
                        </span>
                      </div>
                      {Array.from({ length: 12 }, (_, mi) => {
                        const isActive = bars.includes(mi)
                        const isCurrent = mi + 1 === currentMonth
                        return (
                          <div
                            key={mi}
                            className="h-9 rounded-lg flex items-center justify-center transition-all"
                            style={{
                              background: isActive ? sc.light : 'var(--color-surface-2)',
                              border: isActive ? 'none' : '1px solid var(--color-border)',
                            }}
                          >
                            {isActive && (
                              <div
                                className="h-5 w-full rounded-md"
                                style={{
                                  background: sc.bg,
                                  opacity: isCurrent ? 1 : 0.45,
                                  boxShadow: isCurrent ? `0 2px 8px ${sc.bg}60` : 'none',
                                }}
                              />
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-5 mt-6 pt-5" style={{ borderTop: '1px solid var(--color-border)' }}>
                {STATUS_KEYS.map(status => {
                  const sc = STATUS_COLORS[status]
                  return (
                    <div key={status} className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      <span className="w-3 h-3 rounded-md" style={{ background: sc.bg }} />
                      {sc.label}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          {STATUS_KEYS.map(status => {
            const sc = STATUS_COLORS[status]
            const statusCrops = crops.filter(c => c.status === status)
            if (statusCrops.length === 0) return null
            return (
              <div
                key={status}
                className="card"
                style={{ padding: '20px', borderColor: sc.light + '60', borderLeft: `3px solid ${sc.bg}` }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-3 h-3 rounded-full" style={{ background: sc.bg }} />
                  <span className="text-xs font-bold uppercase tracking-widest" style={{ color: sc.text }}>{sc.label}</span>
                  <span className="ml-auto text-xs font-bold" style={{ color: 'var(--color-text-muted)' }}>{statusCrops.length}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {statusCrops.slice(0, 6).map(c => (
                    <span
                      key={c.name}
                      className="text-xs px-2 py-1 rounded-lg font-medium"
                      style={{ background: sc.light, color: sc.text }}
                    >
                      {c.name}
                    </span>
                  ))}
                  {statusCrops.length > 6 && (
                    <span className="text-xs font-medium px-1 py-1" style={{ color: 'var(--color-text-muted)' }}>
                      +{statusCrops.length - 6} more
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
