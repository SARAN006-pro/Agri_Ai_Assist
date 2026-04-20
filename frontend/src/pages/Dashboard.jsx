import { useEffect, useState } from 'react'
import {
  BarChart, Bar, CartesianGrid, Cell,
  Legend, Pie, PieChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from 'recharts'
import {
  MessageSquare, TrendingUp, Upload, Sprout,
  FileText, ArrowRight, Zap, Shield, BookOpen,
} from 'lucide-react'

import StatCard from '../components/StatCard'
import TopBar from '../components/TopBar'
import { StatSkeleton } from '../components/Skeleton'
import { getRagStats, getStats, getStatsBreakdown, getStatsHistory } from '../services/api'

const ACTIVITY_COLORS = ['#10b981', '#3b82f6', '#a855f7']
const PIE_COLORS = ['#10b981', '#3b82f6', '#a855f7', '#f59e0b']

const QUICK_ACTIONS = [
  { href: '/chat', label: 'Ask AI', icon: MessageSquare, color: 'green', desc: 'Chat with SmartFarm' },
  { href: '/recommend', label: 'Crop Advisor', icon: Sprout, color: 'blue', desc: 'Get recommendations' },
  { href: '/analytics', label: 'Upload Doc', icon: Upload, color: 'purple', desc: 'Add to knowledge base' },
  { href: '/records', label: 'Yield Records', icon: TrendingUp, color: 'amber', desc: 'Track harvests' },
]

const FEATURES = [
  { icon: Zap, label: 'Real-time AI', desc: 'Powered by Mistral 7B via OpenRouter' },
  { icon: Shield, label: 'Local Processing', desc: 'All ML models run locally on your machine' },
  { icon: BookOpen, label: 'RAG Pipeline', desc: 'Upload docs and get grounded answers' },
]

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div
      style={{
        background: 'var(--color-surface-dark)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 'var(--radius-md)',
        padding: '10px 14px',
        fontSize: '0.8125rem',
        color: 'white',
        boxShadow: 'var(--shadow-xl)',
      }}
    >
      <p style={{ fontWeight: 600, marginBottom: 6 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, fontWeight: 500 }}>
          {p.name}: <span style={{ fontWeight: 700 }}>{p.value}</span>
        </p>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [ragStats, setRagStats] = useState(null)
  const [history, setHistory] = useState([])
  const [breakdown, setBreakdown] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getStats(), getRagStats(), getStatsHistory(), getStatsBreakdown()])
      .then(([s, r, h, b]) => {
        setStats(s.data)
        setRagStats(r.data)
        setHistory(h.data)
        setBreakdown(b.data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="flex-1 flex flex-col overflow-y-auto">
      <TopBar
        title="Dashboard"
        subtitle="Welcome back — here's your farm at a glance"
      />

      <div className="page-container">
        {/* ── Stat Cards ─────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8 stagger-children">
          {loading ? (
            <>
              <StatSkeleton />
              <StatSkeleton />
              <StatSkeleton />
              <StatSkeleton />
            </>
          ) : (
            <>
              <StatCard
                title="Total Chats"
                value={stats?.total_chats ?? 0}
                subtitle="messages sent"
                icon={MessageSquare}
                color="green"
              />
              <StatCard
                title="Predictions"
                value={stats?.total_predictions ?? 0}
                subtitle="crop &amp; yield runs"
                icon={TrendingUp}
                color="blue"
              />
              <StatCard
                title="Documents"
                value={stats?.total_uploads ?? 0}
                subtitle="files indexed"
                icon={Upload}
                color="purple"
              />
              <StatCard
                title="Chunks Indexed"
                value={ragStats?.total_chunks ?? 0}
                subtitle="knowledge fragments"
                icon={FileText}
                color="amber"
              />
            </>
          )}
        </div>

        {/* ── Charts Row ─────────────────────────────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mb-8">
          {/* Activity Chart */}
          <div
            className="card xl:col-span-2"
            style={{ padding: '24px', borderColor: 'var(--color-border)' }}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="section-title">Activity Overview</h2>
                <p className="section-subtitle">Last 7 days — chats, predictions &amp; uploads</p>
              </div>
              <span className="badge badge-neutral">This week</span>
            </div>

            {history.length === 0 && !loading ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                  style={{ background: 'var(--color-surface-3)' }}
                >
                  <Zap size={28} style={{ color: 'var(--color-text-muted)' }} />
                </div>
                <p className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>
                  No activity yet
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                  Start chatting or making predictions to see data here.
                </p>
              </div>
            ) : (
              <div style={{ height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={history} barCategoryGap="28%">
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--color-border)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }}
                      axisLine={false}
                      tickLine={false}
                      width={30}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      wrapperStyle={{ fontSize: 12, paddingTop: 16 }}
                      iconType="circle"
                      iconSize={8}
                    />
                    <Bar
                      dataKey="chats"
                      name="Chats"
                      fill="#10b981"
                      radius={[6, 6, 0, 0]}
                    />
                    <Bar
                      dataKey="predictions"
                      name="Predictions"
                      fill="#3b82f6"
                      radius={[6, 6, 0, 0]}
                    />
                    <Bar
                      dataKey="uploads"
                      name="Uploads"
                      fill="#a855f7"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Usage Breakdown */}
          <div
            className="card"
            style={{ padding: '24px', borderColor: 'var(--color-border)' }}
          >
            <h2 className="section-title mb-1">Usage Breakdown</h2>
            <p className="section-subtitle mb-6">All-time by event type</p>

            {breakdown.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                  No breakdown data yet.
                </p>
              </div>
            ) : (
              <>
                <div style={{ height: 180 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={breakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {breakdown.map((_, index) => (
                          <Cell
                            key={index}
                            fill={PIE_COLORS[index % PIE_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="flex flex-col gap-2.5 mt-2">
                  {breakdown.map((item, index) => (
                    <div
                      key={item.name}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ background: PIE_COLORS[index % PIE_COLORS.length] }}
                        />
                        <span
                          className="text-sm font-medium"
                          style={{ color: 'var(--color-text-secondary)' }}
                        >
                          {item.name}
                        </span>
                      </div>
                      <span
                        className="text-sm font-bold"
                        style={{ color: 'var(--color-text)' }}
                      >
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Knowledge Base & Quick Actions ──────────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mb-8">
          {/* Knowledge Base */}
          <div
            className="card xl:col-span-2"
            style={{ padding: '24px', borderColor: 'var(--color-border)' }}
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="section-title">Knowledge Base</h2>
                <p className="section-subtitle">
                  {ragStats?.total_documents ?? 0} documents · {ragStats?.total_chunks ?? 0} chunks indexed
                </p>
              </div>
              <a
                href="/analytics"
                className="flex items-center gap-1 text-xs font-semibold"
                style={{ color: 'var(--color-primary)' }}
              >
                Manage
                <ArrowRight size={13} />
              </a>
            </div>

            {ragStats?.sources?.length === 0 ? (
              <div
                className="drop-zone"
                style={{ padding: '28px 20px' }}
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
                  style={{ background: 'var(--color-surface-3)' }}
                >
                  <BookOpen size={22} style={{ color: 'var(--color-text-muted)' }} />
                </div>
                <p
                  className="font-semibold text-sm mb-1"
                  style={{ color: 'var(--color-text)' }}
                >
                  No documents uploaded yet
                </p>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  Go to Analytics to upload farming guides and PDFs.
                </p>
              </div>
            ) : (
              <div
                className="flex flex-wrap gap-2"
                style={{ maxHeight: 120, overflowY: 'auto' }}
              >
                {ragStats?.sources?.map((source) => (
                  <div
                    key={source}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm"
                    style={{
                      background: 'var(--color-surface-2)',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-text-secondary)',
                    }}
                  >
                    <FileText
                      size={13}
                      style={{ color: 'var(--color-primary)' }}
                      strokeWidth={2}
                    />
                    <span className="truncate max-w-[200px]">{source}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="card" style={{ padding: '24px', borderColor: 'var(--color-border)' }}>
            <h2 className="section-title mb-5">Quick Actions</h2>
            <div className="flex flex-col gap-2.5">
              {QUICK_ACTIONS.map(({ href, label, icon: Icon, color, desc }) => {
                const colorMap = {
                  green: '#10b981',
                  blue: '#3b82f6',
                  purple: '#a855f7',
                  amber: '#f59e0b',
                }
                const bgMap = {
                  green: 'rgba(16,185,129,0.08)',
                  blue: 'rgba(59,130,246,0.08)',
                  purple: 'rgba(168,85,247,0.08)',
                  amber: 'rgba(245,158,11,0.08)',
                }
                return (
                  <a
                    key={href}
                    href={href}
                    className="flex items-center gap-3 p-3 rounded-xl transition-all duration-150 group"
                    style={{
                      background: bgMap[color],
                      border: '1px solid transparent',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = colorMap[color] + '40'
                      e.currentTarget.style.transform = 'translateX(4px)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'transparent'
                      e.currentTarget.style.transform = 'translateX(0)'
                    }}
                  >
                    <div
                      className="flex items-center justify-center rounded-xl flex-shrink-0"
                      style={{
                        width: 38, height: 38,
                        background: colorMap[color] + '20',
                      }}
                    >
                      <Icon
                        size={18}
                        style={{ color: colorMap[color] }}
                        strokeWidth={2}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-sm font-semibold"
                        style={{ color: 'var(--color-text)' }}
                      >
                        {label}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        {desc}
                      </p>
                    </div>
                    <ArrowRight
                      size={15}
                      className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                      style={{ color: colorMap[color] }}
                    />
                  </a>
                )
              })}
            </div>
          </div>
        </div>

        {/* ── Features Bar ───────────────────────────────── */}
        <div
          className="card"
          style={{
            padding: '20px 24px',
            borderColor: 'var(--color-border)',
            background: 'linear-gradient(135deg, rgba(16,185,129,0.04), rgba(132,204,22,0.04))',
          }}
        >
          <div className="flex flex-wrap items-center justify-center gap-8">
            {FEATURES.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-center gap-2.5">
                <div
                  className="flex items-center justify-center rounded-xl"
                  style={{
                    width: 32, height: 32,
                    background: 'rgba(16,185,129,0.1)',
                  }}
                >
                  <Icon size={16} style={{ color: 'var(--color-primary)' }} strokeWidth={2} />
                </div>
                <div>
                  <p className="text-xs font-bold" style={{ color: 'var(--color-text)' }}>
                    {label}
                  </p>
                  <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                    {desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
