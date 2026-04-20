import { useState, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, MessageSquare, Sprout, BarChart3,
  Settings, MapPin, TrendingUp, Calendar, Droplets,
  DollarSign, FolderOpen, Radio, ChevronRight,
} from 'lucide-react'

const NAV_SECTIONS = [
  {
    label: 'Overview',
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/chat', label: 'AI Chat', icon: MessageSquare },
      { to: '/recommend', label: 'Crop Advisor', icon: Sprout },
      { to: '/analytics', label: 'Analytics', icon: BarChart3 },
    ],
  },
  {
    label: 'Farm Operations',
    items: [
      { to: '/market', label: 'Market Prices', icon: TrendingUp },
      { to: '/calendar', label: 'Crop Calendar', icon: Calendar },
      { to: '/irrigation', label: 'Irrigation', icon: Droplets },
      { to: '/economics', label: 'Profit Margin', icon: DollarSign },
      { to: '/records', label: 'Yield Records', icon: FolderOpen },
      { to: '/sensors', label: 'IoT Sensors', icon: Radio },
    ],
  },
  {
    label: 'Account',
    items: [
      { to: '/farm', label: 'My Farm', icon: MapPin },
      { to: '/settings', label: 'Settings', icon: Settings },
    ],
  },
]

export default function Sidebar({ isOpen, onClose }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024)

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024
      setIsMobile(mobile)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleNavClick = () => {
    if (isMobile) onClose?.()
  }

  // Always show sidebar on desktop (isMobile = false)
  const visible = isMobile ? isOpen : true

  return (
    <aside
      className="fixed left-0 top-0 h-screen flex flex-col z-40 transition-transform duration-300"
      style={{
        width: 'var(--sidebar-width)',
        background: 'var(--color-surface)',
        borderRight: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-sm)',
        transform: visible ? 'translateX(0)' : 'translateX(-100%)',
      }}
    >
      {/* Logo & Brand */}
      <div
        className="flex items-center gap-3 px-5"
        style={{ height: 'var(--topbar-height)', borderBottom: '1px solid var(--color-border)' }}
      >
        <div
          className="flex items-center justify-center rounded-2xl shadow-md"
          style={{
            width: 42, height: 42,
            background: 'linear-gradient(135deg, #10b981, #059669)',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
          }}
        >
          <Sprout size={22} strokeWidth={2.2} style={{ color: 'white' }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm leading-none tracking-tight" style={{ color: 'var(--color-text)' }}>
            SmartFarm AI
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
            Copilot v1.0
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label} className="mb-5">
            <p
              className="text-[10px] font-bold tracking-widest uppercase px-3 mb-2"
              style={{ color: 'var(--color-text-muted)' }}
            >
              {section.label}
            </p>
            <div className="flex flex-col gap-0.5">
              {section.items.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={handleNavClick}
                  className={({ isActive }) =>
                    [
                      'group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 relative overflow-hidden',
                      isActive
                        ? 'text-primary font-semibold'
                        : 'hover:text-[var(--color-text)]',
                    ].join(' ')
                  }
                  style={({ isActive }) =>
                    isActive
                      ? {
                          background: 'linear-gradient(135deg, rgba(16,185,129,0.12), rgba(16,185,129,0.06))',
                          color: 'var(--color-primary)',
                        }
                      : { color: 'var(--color-text-secondary)' }
                  }
                >
                  {({ isActive }) => (
                    <>
                      {/* Active indicator bar */}
                      {isActive && (
                        <span
                          className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-full"
                          style={{
                            height: '60%',
                            background: 'var(--color-primary)',
                            boxShadow: '0 0 8px rgba(16,185,129,0.5)',
                          }}
                        />
                      )}

                      {/* Icon */}
                      <span
                        className="flex items-center justify-center rounded-lg transition-all duration-150"
                        style={{
                          width: 34, height: 34,
                          background: isActive
                            ? 'rgba(16,185,129,0.15)'
                            : 'transparent',
                        }}
                      >
                        <Icon
                          size={18}
                          strokeWidth={isActive ? 2.25 : 1.75}
                          style={isActive ? { color: 'var(--color-primary)' } : {}}
                        />
                      </span>

                      <span className="flex-1">{label}</span>

                      {/* Hover arrow */}
                      <ChevronRight
                        size={14}
                        className="opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                        style={{ color: 'var(--color-text-muted)' }}
                      />
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div
        className="px-5 py-4 text-center"
        style={{ borderTop: '1px solid var(--color-border)' }}
      >
        <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
          Powered by FastAPI &amp; OpenRouter
        </p>
      </div>
    </aside>
  )
}
