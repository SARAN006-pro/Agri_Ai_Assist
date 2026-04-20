import { useEffect, useState } from 'react'
import {
  Loader2, Moon, Sun, Wifi, WifiOff,
  Bell, Search, ChevronDown, LogOut,
} from 'lucide-react'
import { getStats } from '../services/api'

const STATUS_CONFIG = {
  connected: {
    icon: Wifi,
    dot: 'bg-emerald-500',
    badge: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-500/30',
    label: 'Connected',
  },
  disconnected: {
    icon: WifiOff,
    dot: 'bg-rose-500',
    badge: 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-500/30',
    label: 'Offline',
  },
  loading: {
    icon: Loader2,
    dot: 'bg-amber-500',
    badge: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-500/30',
    label: 'Connecting',
  },
}

function ThemeToggle({ isDark, onToggle }) {
  return (
    <button
      onClick={onToggle}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="btn btn-ghost btn-icon relative overflow-hidden"
      style={{ borderRadius: 'var(--radius-md)' }}
    >
      <span
        className="absolute inset-0 flex items-center justify-center transition-all duration-300"
        style={{ opacity: isDark ? 0 : 1, transform: isDark ? 'rotate(90deg) scale(0.5)' : 'rotate(0deg) scale(1)' }}
      >
        <Sun size={17} strokeWidth={2} style={{ color: 'var(--color-text-secondary)' }} />
      </span>
      <span
        className="absolute inset-0 flex items-center justify-center transition-all duration-300"
        style={{ opacity: isDark ? 1 : 0, transform: isDark ? 'rotate(0deg) scale(1)' : 'rotate(-90deg) scale(0.5)' }}
      >
        <Moon size={17} strokeWidth={2} style={{ color: 'var(--color-text-secondary)' }} />
      </span>
    </button>
  )
}

export default function TopBar({ title, subtitle, status = 'connected', actions }) {
  const [dark, setDark] = useState(() => {
    if (typeof window === 'undefined') return false
    return document.documentElement.classList.contains('dark')
  })
  const [apiStatus, setApiStatus] = useState(status)
  const config = STATUS_CONFIG[apiStatus] || STATUS_CONFIG.loading
  const StatusIcon = config.icon

  useEffect(() => {
    setApiStatus(status)
  }, [status])

  useEffect(() => {
    const saved = localStorage.getItem('theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const isDark = saved === 'dark' || (!saved && prefersDark)
    document.documentElement.classList.toggle('dark', isDark)
    setDark(isDark)

    // Probe API health
    const checkApi = async () => {
      setApiStatus('loading')
      try {
        await getStats()
        setApiStatus('connected')
      } catch {
        setApiStatus('disconnected')
      }
    }
    checkApi()
    const interval = setInterval(checkApi, 30000)
    return () => clearInterval(interval)
  }, [])

  const toggleDark = () => {
    const isDark = document.documentElement.classList.toggle('dark')
    localStorage.setItem('theme', isDark ? 'dark' : 'light')
    setDark(isDark)
  }

  return (
    <header
      className="sticky top-0 z-30 flex items-center px-6 gap-4"
      style={{
        height: 'var(--topbar-height)',
        background: 'var(--color-surface)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--color-border)',
      }}
    >

      {/* Title */}
      <div className="flex-1 min-w-0">
        <h1
          className="leading-none font-bold tracking-tight"
          style={{ fontSize: '1.0625rem', color: 'var(--color-text)' }}
        >
          {title}
        </h1>
        {subtitle && (
          <p
            className="mt-0.5 text-xs leading-none"
            style={{ color: 'var(--color-text-muted)' }}
          >
            {subtitle}
          </p>
        )}
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2">
        {/* Search (decorative) */}
        <button
          className="btn btn-ghost btn-icon hide-mobile"
          style={{ borderRadius: 'var(--radius-md)' }}
        >
          <Search size={17} strokeWidth={2} style={{ color: 'var(--color-text-muted)' }} />
        </button>

        {/* Notifications bell */}
        <button
          className="btn btn-ghost btn-icon relative hide-mobile"
          style={{ borderRadius: 'var(--radius-md)' }}
        >
          <Bell size={17} strokeWidth={2} style={{ color: 'var(--color-text-muted)' }} />
          <span
            className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
            style={{ background: 'var(--color-primary)', boxShadow: '0 0 6px rgba(16,185,129,0.5)' }}
          />
        </button>

        {/* Theme toggle */}
        <ThemeToggle isDark={dark} onToggle={toggleDark} />

        {/* API Status */}
        <div
          className="flex items-center gap-2 pl-2"
          style={{ borderLeft: '1px solid var(--color-border)' }}
        >
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold ${config.badge}`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${config.dot} ${apiStatus === 'connected' ? 'animate-pulse-dot' : ''}`}
            />
            <StatusIcon
              size={12}
              className={apiStatus === 'loading' ? 'animate-spin' : ''}
            />
            <span className="hidden sm:inline">{config.label}</span>
          </div>
        </div>
      </div>
    </header>
  )
}
