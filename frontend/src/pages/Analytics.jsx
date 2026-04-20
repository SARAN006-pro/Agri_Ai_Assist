import { useRef, useState } from 'react'
import { Line, LineChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { FileUp, FileSearch, FileText, SearchX, Upload, Database, BookOpen, CheckCircle2, AlertCircle } from 'lucide-react'

import TopBar from '../components/TopBar'
import EmptyState from '../components/EmptyState'
import { getRagStats, queryDocuments, uploadDocument } from '../services/api'

const SAMPLE_YIELD_DATA = [
  { year: '2019', rice: 3800, wheat: 2900, maize: 4800 },
  { year: '2020', rice: 4100, wheat: 3100, maize: 5200 },
  { year: '2021', rice: 3950, wheat: 3300, maize: 5000 },
  { year: '2022', rice: 4400, wheat: 3500, maize: 5600 },
  { year: '2023', rice: 4600, wheat: 3200, maize: 5900 },
  { year: '2024', rice: 4750, wheat: 3600, maize: 6100 },
]

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--color-surface-dark)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '10px 14px', fontSize: '0.8125rem', color: 'white', boxShadow: 'var(--shadow-xl)' }}>
      <p style={{ fontWeight: 600, marginBottom: 6 }}>{label}</p>
      {payload.map((p, i) => <p key={i} style={{ color: p.color }}>{p.name}: <strong>{Number(p.value).toLocaleString()} kg/ha</strong></p>)}
    </div>
  )
}

export default function Analytics() {
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState(null)
  const [question, setQuestion] = useState('')
  const [querying, setQuerying] = useState(false)
  const [answer, setAnswer] = useState(null)
  const [stats, setStats] = useState(null)
  const [error, setError] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef(null)

  const handleUpload = async () => {
    if (!file) return
    setUploading(true); setError('')
    const formData = new FormData()
    formData.append('file', file)
    try {
      const resp = await uploadDocument(formData)
      setUploadResult(resp.data)
      const statsResp = await getRagStats()
      setStats(statsResp.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Upload failed. Please try again.')
    } finally { setUploading(false) }
  }

  const handleQuery = async () => {
    if (!question.trim()) return
    setQuerying(true); setError('')
    try {
      const resp = await queryDocuments(question)
      setAnswer(resp.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Query failed. Please try again.')
    } finally { setQuerying(false) }
  }

  return (
    <div className="flex-1 flex flex-col overflow-y-auto">
      <TopBar
        title="Analytics"
        subtitle="Explore yield trends, upload documents, and query your knowledge base"
      />

      <div className="page-container">
        {/* ── Yield Trends Chart ─────────────────────────── */}
        <div className="card mb-8" style={{ padding: '24px', borderColor: 'var(--color-border)' }}>
          <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
            <div>
              <h2 className="section-title">Yield Trends</h2>
              <p className="section-subtitle">Historical crop yield data (kg/ha) — sample data</p>
            </div>
            <span className="badge badge-warning text-xs">Demo Data</span>
          </div>
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={SAMPLE_YIELD_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="year" tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
                  axisLine={false} tickLine={false}
                  tickFormatter={v => `${(v / 1000).toFixed(1)}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 16 }} iconType="circle" iconSize={8} />
                <Line type="monotone" dataKey="rice" name="Rice" stroke="#10b981" strokeWidth={2.5} dot={{ fill: '#10b981', r: 4 }} activeDot={{ r: 7 }} />
                <Line type="monotone" dataKey="wheat" name="Wheat" stroke="#3b82f6" strokeWidth={2.5} dot={{ fill: '#3b82f6', r: 4 }} activeDot={{ r: 7 }} />
                <Line type="monotone" dataKey="maize" name="Maize" stroke="#f59e0b" strokeWidth={2.5} dot={{ fill: '#f59e0b', r: 4 }} activeDot={{ r: 7 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* ── Left: Upload + Stats ────────────────────── */}
          <div className="space-y-6">
            {/* Upload Card */}
            <div className="card" style={{ padding: '24px', borderColor: 'var(--color-border)' }}>
              <div className="flex items-center gap-2 mb-5">
                <div className="flex items-center justify-center rounded-xl" style={{ width: 36, height: 36, background: 'rgba(16,185,129,0.1)' }}>
                  <Upload size={17} style={{ color: 'var(--color-primary)' }} strokeWidth={2} />
                </div>
                <div>
                  <h2 className="section-title">Upload Document</h2>
                  <p className="section-subtitle">Add farming guides to your knowledge base</p>
                </div>
              </div>

              {error && (
                <div className="alert alert-danger mb-4 animate-fade-up">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              <div
                onClick={() => fileRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault(); setDragOver(false)
                  const f = e.dataTransfer.files?.[0]
                  if (f) setFile(f)
                }}
                className={`drop-zone ${dragOver ? 'drag-over' : ''}`}
                style={{ padding: '32px 24px', marginBottom: 16 }}
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
                  style={{ background: 'var(--color-surface-3)' }}
                >
                  <FileUp size={22} style={{ color: 'var(--color-text-muted)' }} strokeWidth={1.75} />
                </div>
                <p className="font-semibold text-sm mb-1" style={{ color: 'var(--color-text)' }}>
                  {file ? file.name : 'Drag a file here, or click to select'}
                </p>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  PDF, TXT or MD — max 10 MB
                </p>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf,.txt,.md"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
              </div>

              {file && (
                <div
                  className="flex items-center gap-3 p-3 rounded-xl mb-4 animate-fade-in"
                  style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}
                >
                  <FileText size={18} style={{ color: 'var(--color-primary)' }} strokeWidth={1.75} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text)' }}>{file.name}</p>
                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                  <button onClick={() => setFile(null)} className="btn btn-ghost btn-icon btn-sm">
                    ×
                  </button>
                </div>
              )}

              <button
                onClick={handleUpload}
                disabled={!file || uploading}
                className="btn btn-primary w-full"
              >
                {uploading ? (
                  <><span className="spinner spinner-sm" />Indexing...</>
                ) : (
                  <><Upload size={16} /> Upload and Index</>
                )}
              </button>

              {uploadResult && (
                <div className="alert alert-success mt-4 animate-fade-up">
                  <CheckCircle2 size={16} />
                  <span>
                    Indexed <strong>{uploadResult.filename}</strong> — {uploadResult.chunks_indexed} chunks created
                  </span>
                </div>
              )}
            </div>

            {/* RAG Stats */}
            {stats && (
              <div className="card" style={{ padding: '24px', borderColor: 'var(--color-border)' }}>
                <div className="flex items-center gap-2 mb-5">
                  <div className="flex items-center justify-center rounded-xl" style={{ width: 36, height: 36, background: 'rgba(168,85,247,0.1)' }}>
                    <Database size={17} style={{ color: '#a855f7' }} strokeWidth={2} />
                  </div>
                  <div>
                    <h2 className="section-title">Knowledge Base</h2>
                    <p className="section-subtitle">{stats.total_documents} documents · {stats.total_chunks} chunks</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="text-center p-4 rounded-xl" style={{ background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.2)' }}>
                    <p className="text-2xl font-extrabold" style={{ color: 'var(--color-primary)' }}>{stats.total_documents}</p>
                    <p className="text-xs font-semibold mt-1" style={{ color: 'var(--color-text-muted)' }}>Documents</p>
                  </div>
                  <div className="text-center p-4 rounded-xl" style={{ background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.2)' }}>
                    <p className="text-2xl font-extrabold" style={{ color: '#3b82f6' }}>{stats.total_chunks}</p>
                    <p className="text-xs font-semibold mt-1" style={{ color: 'var(--color-text-muted)' }}>Chunks</p>
                  </div>
                </div>

                {stats.sources?.length > 0 && (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {stats.sources.map((source) => (
                      <div
                        key={source}
                        className="flex items-center gap-2 p-2.5 rounded-xl text-sm"
                        style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}
                      >
                        <FileText size={13} style={{ color: 'var(--color-primary)' }} strokeWidth={2} />
                        <span className="truncate">{source}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Right: Query ──────────────────────────────── */}
          <div className="card" style={{ padding: '24px', borderColor: 'var(--color-border)' }}>
            <div className="flex items-center gap-2 mb-5">
              <div className="flex items-center justify-center rounded-xl" style={{ width: 36, height: 36, background: 'rgba(14,165,233,0.1)' }}>
                <FileSearch size={17} style={{ color: '#0ea5e9' }} strokeWidth={2} />
              </div>
              <div>
                <h2 className="section-title">Query Documents</h2>
                <p className="section-subtitle">Ask questions grounded in your uploaded files</p>
              </div>
            </div>

            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g. What is the best time to plant wheat? Refer to uploaded guides..."
              rows={4}
              className="input mb-3"
              style={{ resize: 'vertical', minHeight: 100 }}
            />
            <button
              onClick={handleQuery}
              disabled={!question.trim() || querying}
              className="btn btn-primary w-full"
            >
              {querying ? (
                <><span className="spinner spinner-sm" />Searching...</>
              ) : (
                <><FileSearch size={16} /> Ask Question</>
              )}
            </button>

            {answer && (
              <div className="mt-6 space-y-4 animate-fade-up">
                <div
                  className="p-5 rounded-xl"
                  style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}
                >
                  <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--color-text-muted)' }}>
                    Answer
                  </p>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--color-text-secondary)' }}>
                    {answer.answer}
                  </p>
                </div>

                {answer.sources?.length > 0 && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--color-text-muted)' }}>
                      Sources Used
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {answer.sources.map((source, index) => (
                        <span
                          key={index}
                          className="badge badge-info"
                          style={{ fontSize: '0.75rem' }}
                        >
                          <FileText size={10} />
                          {source.source}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {!answer && (
              <div className="mt-8">
                <EmptyState
                  icon={SearchX}
                  title="No documents queried yet"
                  description="Upload a document first, then ask questions about its content."
                  className="py-12"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
