import { TrendingUp, TrendingDown } from 'lucide-react'

const COLOR_MAP = {
  green: {
    bg: 'rgba(16, 185, 129, 0.07)',
    border: 'rgba(16, 185, 129, 0.2)',
    text: 'var(--color-primary)',
    iconBg: 'rgba(16, 185, 129, 0.12)',
    icon: '#10b981',
    label: 'text-emerald-700 dark:text-emerald-300',
  },
  blue: {
    bg: 'rgba(59, 130, 246, 0.07)',
    border: 'rgba(59, 130, 246, 0.2)',
    text: '#2563eb',
    iconBg: 'rgba(59, 130, 246, 0.12)',
    icon: '#3b82f6',
    label: 'text-sky-700 dark:text-sky-300',
  },
  purple: {
    bg: 'rgba(168, 85, 247, 0.07)',
    border: 'rgba(168, 85, 247, 0.2)',
    text: '#7c3aed',
    iconBg: 'rgba(168, 85, 247, 0.12)',
    icon: '#a855f7',
    label: 'text-violet-700 dark:text-violet-300',
  },
  amber: {
    bg: 'rgba(245, 158, 11, 0.07)',
    border: 'rgba(245, 158, 11, 0.2)',
    text: '#d97706',
    iconBg: 'rgba(245, 158, 11, 0.12)',
    icon: '#f59e0b',
    label: 'text-amber-700 dark:text-amber-300',
  },
  rose: {
    bg: 'rgba(244, 63, 94, 0.07)',
    border: 'rgba(244, 63, 94, 0.2)',
    text: '#e11d48',
    iconBg: 'rgba(244, 63, 94, 0.12)',
    icon: '#f43f5e',
    label: 'text-rose-700 dark:text-rose-300',
  },
  sky: {
    bg: 'rgba(14, 165, 233, 0.07)',
    border: 'rgba(14, 165, 233, 0.2)',
    text: '#0284c7',
    iconBg: 'rgba(14, 165, 233, 0.12)',
    icon: '#0ea5e9',
    label: 'text-sky-700 dark:text-sky-300',
  },
  teal: {
    bg: 'rgba(20, 184, 166, 0.07)',
    border: 'rgba(20, 184, 166, 0.2)',
    text: '#0d9488',
    iconBg: 'rgba(20, 184, 166, 0.12)',
    icon: '#14b8a6',
    label: 'text-teal-700 dark:text-teal-300',
  },
  orange: {
    bg: 'rgba(249, 115, 22, 0.07)',
    border: 'rgba(249, 115, 22, 0.2)',
    text: '#ea580c',
    iconBg: 'rgba(249, 115, 22, 0.12)',
    icon: '#f97316',
    label: 'text-orange-700 dark:text-orange-300',
  },
}

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'green',
  trend,
  trendValue,
  className = '',
}) {
  const c = COLOR_MAP[color] || COLOR_MAP.green

  return (
    <div
      className={`card relative ${className}`}
      style={{
        padding: '22px',
        background: c.bg,
        borderColor: c.border,
        overflow: 'hidden',
      }}
    >
      {/* Decorative corner gradient */}
      <div
        style={{
          position: 'absolute',
          top: -20,
          right: -20,
          width: 100,
          height: 100,
          borderRadius: '50%',
          background: c.iconBg,
          opacity: 0.5,
        }}
      />

      <div className="relative flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p
            className="text-[11px] font-bold tracking-widest uppercase mb-4"
            style={{ color: 'var(--color-text-muted)' }}
          >
            {title}
          </p>

          <p
            className="font-extrabold leading-none tracking-tight mb-2"
            style={{ fontSize: '2rem', color: c.text }}
          >
            {value !== undefined && value !== null ? value : '—'}
          </p>

          <div className="flex items-center gap-2 flex-wrap">
            {subtitle && (
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                {subtitle}
              </p>
            )}
            {trend && trendValue !== undefined && (
              <span
                className="flex items-center gap-0.5 text-xs font-bold"
                style={{ color: trend === 'up' ? '#22c55e' : '#ef4444' }}
              >
                {trend === 'up'
                  ? <TrendingUp size={12} />
                  : <TrendingDown size={12} />
                }
                {trendValue}
              </span>
            )}
          </div>
        </div>

        {Icon && (
          <div
            className="flex items-center justify-center rounded-2xl flex-shrink-0"
            style={{
              width: 48, height: 48,
              background: c.iconBg,
            }}
          >
            <Icon size={22} style={{ color: c.icon }} strokeWidth={1.75} />
          </div>
        )}
      </div>
    </div>
  )
}
