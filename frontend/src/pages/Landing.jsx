import { useNavigate } from 'react-router-dom'
import { MessageSquare, Sprout, TrendingUp, FileSearch } from 'lucide-react'

const features = [
  {
    icon: MessageSquare,
    title: 'AI Chat',
    desc: 'Ask any farming question and get expert answers instantly powered by Mistral 7B.',
  },
  {
    icon: Sprout,
    title: 'Crop Advisor',
    desc: 'Enter soil and climate data to get the best crop recommendation for your land.',
  },
  {
    icon: TrendingUp,
    title: 'Yield Predictor',
    desc: 'Estimate your harvest output per hectare before the season starts.',
  },
  {
    icon: FileSearch,
    title: 'Document Q&A',
    desc: 'Upload farming guides and query them with AI-powered grounded answers.',
  },
]

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex flex-col overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.18),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(20,184,166,0.16),_transparent_24%),linear-gradient(180deg,#f0fdf4_0%,#f8fafc_50%,#ffffff_100%)] dark:bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.18),_transparent_24%),radial-gradient(circle_at_top_right,_rgba(20,184,166,0.14),_transparent_20%),linear-gradient(180deg,#020617_0%,#0f172a_100%)]">
      <div className="absolute inset-0 pointer-events-none opacity-60 bg-[linear-gradient(rgba(255,255,255,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.4)_1px,transparent_1px)] bg-[size:72px_72px] dark:opacity-20" />

      <div className="relative flex flex-col items-center justify-center text-center px-6 pt-24 pb-16">
        <div className="w-20 h-20 rounded-3xl flex items-center justify-center bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-xl shadow-emerald-500/25 mb-6">
          <Sprout size={38} color="white" strokeWidth={2.2} />
        </div>

        <p className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-emerald-200/70 dark:border-emerald-500/20 bg-white/80 dark:bg-slate-900/80 text-xs font-medium text-emerald-700 dark:text-emerald-300 mb-6 backdrop-blur">
          SmartFarm AI Copilot
        </p>

        <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-slate-950 dark:text-white max-w-4xl leading-tight mb-6">
          Smart farming decisions,{' '}
          <span className="text-emerald-600 dark:text-emerald-400">powered by AI.</span>
        </h1>

        <p className="text-lg md:text-xl text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
          One intelligent workspace for crop recommendations, yield forecasting, and document-grounded answers — all running locally with your own data.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-emerald-600 hover:bg-emerald-700 active:scale-[0.97] text-white font-semibold px-8 py-3.5 rounded-2xl transition-all shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/30 hover:-translate-y-0.5"
          >
            Open Dashboard
          </button>
          <button
            onClick={() => navigate('/chat')}
            className="bg-white/85 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-semibold px-8 py-3.5 rounded-2xl transition-all hover:-translate-y-0.5"
          >
            Start Chatting
          </button>
        </div>
      </div>

      <div className="relative max-w-6xl mx-auto px-6 pb-20 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {features.map(({ icon: Icon, title, desc }, index) => (
          <div
            key={title}
            className={`fade-up card-hover bg-white/85 dark:bg-slate-900/85 backdrop-blur rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm opacity-0 stagger-${index + 1}`}
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center mb-4">
              <Icon size={22} className="text-emerald-600 dark:text-emerald-400" strokeWidth={1.75} />
            </div>
            <h3 className="font-semibold text-slate-900 dark:text-white text-base mb-2">{title}</h3>
            <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
