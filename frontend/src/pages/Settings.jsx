import { useState } from 'react'
import { Globe, Cpu, Layers, Lock, Eye, EyeOff, Server, Brain, ChevronDown, ChevronUp, RefreshCw, Info } from 'lucide-react'

import TopBar from '../components/TopBar'

const APP_CONFIG = [
  { icon: Server, label: 'Backend URL', value: 'http://localhost:8000', note: 'FastAPI server address' },
  { icon: Brain, label: 'LLM Model', value: 'nvidia/nemotron-3-super-120b-a12b:free', note: 'Model used for chat and RAG' },
  { icon: Layers, label: 'Chunk size', value: '500 characters', note: 'RAG document chunking size' },
  { icon: Globe, label: 'Top-K chunks', value: '3', note: 'Chunks retrieved per query' },
]

function ConfigRow({ icon: Icon, label, value, note }) {
  return (
    <div
      className="flex items-center justify-between gap-4 p-4 rounded-xl transition-all duration-150"
      style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
    >
      <div className="flex items-center gap-3">
        <div
          className="flex items-center justify-center rounded-xl flex-shrink-0"
          style={{ width: 38, height: 38, background: 'var(--color-surface-3)' }}
        >
          <Icon size={16} style={{ color: 'var(--color-text-muted)' }} strokeWidth={1.75} />
        </div>
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>{label}</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{note}</p>
        </div>
      </div>
      <span
        className="text-sm font-mono px-3 py-1.5 rounded-xl flex-shrink-0"
        style={{
          background: 'rgba(16,185,129,0.08)',
          color: 'var(--color-primary)',
          border: '1px solid rgba(16,185,129,0.2)',
        }}
      >
        {value}
      </span>
    </div>
  )
}

function AccordionSection({ icon: Icon, iconBg, iconColor, title, subtitle, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)
  const IconBg = iconBg || 'rgba(16,185,129,0.1)'
  const IconClr = iconColor || 'var(--color-primary)'

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface)' }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-5 py-4 flex items-center justify-between text-left transition-colors duration-150"
        style={{ background: open ? 'rgba(16,185,129,0.02)' : 'transparent' }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-surface-2)' }}
        onMouseLeave={(e) => { e.currentTarget.style.background = open ? 'rgba(16,185,129,0.02)' : 'transparent' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center rounded-xl flex-shrink-0"
            style={{ width: 38, height: 38, background: IconBg }}
          >
            <Icon size={17} style={{ color: IconClr }} strokeWidth={1.75} />
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>{title}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{subtitle}</p>
          </div>
        </div>
        <ChevronDown
          size={16}
          style={{
            color: 'var(--color-text-muted)',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
            flexShrink: 0,
          }}
        />
      </button>
      {open && (
        <div
          className="px-5 pb-5 pt-2"
          style={{ borderTop: '1px solid var(--color-border)' }}
        >
          {children}
        </div>
      )}
    </div>
  )
}

export default function Settings() {
  const [apiKeyVisible, setApiKeyVisible] = useState(false)
  const [savedMsg, setSavedMsg] = useState('')

  const handleSave = () => {
    setSavedMsg('Settings saved!')
    setTimeout(() => setSavedMsg(''), 2500)
  }

  return (
    <div className="flex-1 flex flex-col overflow-y-auto">
      <TopBar title="Settings" subtitle="Configure your SmartFarm AI environment" />

      <div className="page-container">
        {/* ── App Configuration ─────────────────────────────── */}
        <div className="mb-6">
          <h2 className="section-title mb-1">Application Configuration</h2>
          <p className="section-subtitle mb-4">Server-side settings for the SmartFarm AI backend</p>
          <div className="flex flex-col gap-3">
            {APP_CONFIG.map((item) => (
              <ConfigRow key={item.label} {...item} />
            ))}
          </div>
        </div>

        {/* ── API Key ────────────────────────────────────── */}
        <div className="mb-6">
          <h2 className="section-title mb-1">API Key</h2>
          <p className="section-subtitle mb-4">Required for AI chat and RAG functionality</p>
          <div
            className="rounded-2xl p-5"
            style={{
              background: 'rgba(245,158,11,0.06)',
              border: '1px solid rgba(245,158,11,0.2)',
            }}
          >
            <div className="flex items-start gap-3">
              <div
                className="flex items-center justify-center rounded-xl flex-shrink-0"
                style={{ width: 38, height: 38, background: 'rgba(245,158,11,0.12)' }}
              >
                <Lock size={17} style={{ color: '#f59e0b' }} strokeWidth={1.75} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold mb-1" style={{ color: 'var(--color-text)' }}>
                  OpenRouter API Key
                </p>
                <p className="text-xs leading-relaxed mb-4" style={{ color: 'var(--color-text-muted)' }}>
                  Add your OpenRouter API key to <code style={{ fontFamily: 'monospace', fontSize: '0.75rem', background: 'rgba(245,158,11,0.1)', padding: '1px 6px', borderRadius: 4 }}>backend/.env</code> to enable real AI responses in chat and RAG queries.
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  <code
                    className="text-sm font-mono px-3 py-2 rounded-xl"
                    style={{
                      background: 'var(--color-surface-3)',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-text)',
                    }}
                  >
                    OPENROUTER_API_KEY=sk-...
                  </code>
                  <button
                    onClick={() => setApiKeyVisible(!apiKeyVisible)}
                    className="btn btn-secondary btn-sm"
                    style={{ gap: 6 }}
                  >
                    {apiKeyVisible ? <EyeOff size={13} /> : <Eye size={13} />}
                    {apiKeyVisible ? 'Hide' : 'Show'}
                  </button>
                  {savedMsg && (
                    <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: 'var(--color-primary)' }}>
                      <RefreshCw size={12} /> {savedMsg}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Quick Actions ───────────────────────────────── */}
        <div className="mb-6">
          <h2 className="section-title mb-1">Quick Actions</h2>
          <p className="section-subtitle mb-4">Common configuration tasks</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { label: 'Reset RAG Index', desc: 'Clear all indexed document chunks', icon: RefreshCw, action: 'reset-index', danger: true },
              { label: 'Clear Chat History', desc: 'Remove all saved chat sessions', icon: RefreshCw, action: 'clear-history', danger: true },
            ].map(({ label, desc, icon: Icon, danger }) => (
              <button
                key={label}
                className="flex items-center gap-3 p-4 rounded-xl text-left transition-all duration-150"
                style={{
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = danger ? 'rgba(239,68,68,0.4)' : 'rgba(16,185,129,0.4)'
                  e.currentTarget.style.transform = 'translateY(-1px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-border)'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                <div
                  className="flex items-center justify-center rounded-xl flex-shrink-0"
                  style={{ width: 36, height: 36, background: danger ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)' }}
                >
                  <Icon size={16} style={{ color: danger ? '#ef4444' : 'var(--color-primary)' }} strokeWidth={1.75} />
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>{label}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ── Privacy ────────────────────────────────────── */}
        <div
          className="rounded-2xl p-5 flex items-start gap-3"
          style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}
        >
          <div
            className="flex items-center justify-center rounded-xl flex-shrink-0"
            style={{ width: 36, height: 36, background: 'rgba(59,130,246,0.08)' }}
          >
            <Info size={16} style={{ color: '#3b82f6' }} strokeWidth={1.75} />
          </div>
          <div>
            <p className="text-sm font-semibold mb-1" style={{ color: 'var(--color-text)' }}>Privacy &amp; Data</p>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
              All data is stored locally on your device. No personal information is sent to external servers except for AI processing via OpenRouter. Chat history, farm profiles, and preferences are saved in your local SQLite database.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
