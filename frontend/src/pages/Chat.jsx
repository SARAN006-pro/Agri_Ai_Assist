import { useEffect, useRef, useState } from 'react'
import {
  Bot, Download, FolderOpen, Plus, Save, SendHorizontal,
  MessageSquare, FileSearch, Trash2, User, X, Clock,
} from 'lucide-react'

import TopBar from '../components/TopBar'
import { SpeechPipeline, VoiceInputButton, VoiceOutputButton } from '../components/SpeechPipeline'
import {
  createSession, deleteSession, exportChat,
  getChatHistory, getSessions, queryDocuments, sendChat,
} from '../services/api'
import { useLanguage } from '../contexts/LanguageContext'

const WELCOME_MSG = 'Hello! I am SmartFarm AI. Ask me anything about crops, soil, irrigation, pest management, or any farming topic.'

export default function Chat() {
  const { language: uiLanguage } = useLanguage()
  const [sessionId, setSessionId] = useState(() => localStorage.getItem('session_id') || '')
  const [messages, setMessages] = useState([
    { role: 'assistant', content: WELCOME_MSG },
  ])
  const [sessions, setSessions] = useState([])
  const [showSessions, setShowSessions] = useState(false)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState('chat')
  const [showExport, setShowExport] = useState(false)
  const [interimText, setInterimText] = useState('')
  const bottomRef = useRef(null)
  const inputRef = useRef(null)
  const speechPipelineRef = useRef(null)

  useEffect(() => { loadSessions() }, [])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const loadSessions = async () => {
    try {
      const resp = await getSessions()
      setSessions(resp.data.sessions || [])
    } catch {}
  }

  const switchSession = async (sid) => {
    setSessionId(sid)
    localStorage.setItem('session_id', sid)
    setShowSessions(false)
    setMessages([{ role: 'assistant', content: 'Session loaded. What would you like to ask?' }])
    try {
      const resp = await getChatHistory(sid)
      const history = resp.data.messages || []
      if (history.length > 0) setMessages(history)
    } catch {}
  }

  const saveCurrentSession = async () => {
    const name = prompt('Name this session:')
    if (!name) return
    try {
      const resp = await createSession(name)
      const newSid = resp.data.session.session_id
      setSessionId(newSid)
      localStorage.setItem('session_id', newSid)
      loadSessions()
    } catch {}
  }

  const handleDeleteSession = async (sid) => {
    if (!confirm('Delete this session and all its messages?')) return
    try {
      await deleteSession(sid)
      if (sid === sessionId) {
        setSessionId('')
        setMessages([{ role: 'assistant', content: WELCOME_MSG }])
        localStorage.removeItem('session_id')
      }
      loadSessions()
    } catch {}
  }

  const handleExport = async (format) => {
    if (!sessionId) { alert('Save your session first'); return }
    try {
      const resp = await exportChat(sessionId, format)
      const mimeTypes = { json: 'application/json', csv: 'text/csv', pdf: 'application/pdf' }
      const blob = new Blob([resp.data], { type: mimeTypes[format] })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = `chat_${sessionId}.${format}`; a.click()
      URL.revokeObjectURL(url)
    } catch { alert('Export failed — make sure your session is saved and backend is running') }
    setShowExport(false)
  }

  const startNewSession = () => {
    setSessionId(''); localStorage.removeItem('session_id')
    setMessages([{ role: 'assistant', content: WELCOME_MSG }])
  }

  const handleVoiceResult = async (translatedText, sourceLang) => {
    if (!translatedText.trim()) return
    const userMessage = { role: 'user', content: translatedText }
    const nextHistory = [...messages, userMessage].slice(-8)
    setMessages((current) => [...current, userMessage])
    setInput(''); setInterimText(''); setLoading(true)

    try {
      let reply = ''
      if (mode === 'rag') {
        const response = await queryDocuments(translatedText)
        reply = response.data.answer || ''
      } else {
        const currentSid = sessionId || undefined
        const response = await sendChat(translatedText, currentSid, nextHistory.map((m) => ({ role: m.role, content: m.content })))
        reply = response.data.reply || ''
        if (!sessionId && response.data.session_id) {
          setSessionId(response.data.session_id)
          localStorage.setItem('session_id', response.data.session_id)
        }
      }
      setMessages((current) => [...current, { role: 'assistant', content: reply }])
      if (speechPipelineRef.current && reply) {
        speechPipelineRef.current.speakReply(reply, sourceLang !== 'en' ? sourceLang : uiLanguage)
      }
    } catch {
      setMessages((current) => [
        ...current,
        { role: 'assistant', content: 'Sorry, I could not reach the AI service. Please check that the backend is running.' },
      ])
    } finally { setLoading(false) }
  }

  const send = async () => {
    const text = input.trim()
    if (!text || loading) return
    const userMessage = { role: 'user', content: text }
    const nextHistory = [...messages, userMessage].slice(-8)
    setMessages((current) => [...current, userMessage])
    setInput(''); setLoading(true)

    try {
      let reply = ''
      if (mode === 'rag') {
        const response = await queryDocuments(text)
        const sources = response.data.sources?.map((s) => s.source).join(', ')
        reply = response.data.answer + (sources ? `\n\nSources: ${sources}` : '')
      } else {
        const currentSid = sessionId || undefined
        const response = await sendChat(text, currentSid, nextHistory.map((m) => ({ role: m.role, content: m.content })))
        reply = response.data.reply
        if (!sessionId && response.data.session_id) {
          setSessionId(response.data.session_id)
          localStorage.setItem('session_id', response.data.session_id)
        }
      }
      setMessages((current) => [...current, { role: 'assistant', content: reply }])
    } catch {
      setMessages((current) => [
        ...current,
        { role: 'assistant', content: 'Sorry, I could not reach the AI service. Please check that the backend is running.' },
      ])
    } finally { setLoading(false) }
  }

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault(); send()
    }
  }

  return (
    <SpeechPipeline
      language={uiLanguage}
      onFinalResult={handleVoiceResult}
      onInterimResult={(text) => setInterimText(text)}
      disabled={loading}
    >
      {({ toggleVoice, isListening: voiceIsListening, isSpeaking: voiceIsSpeaking, speakReply, stopSpeaking }) => {
        speechPipelineRef.current = { speakReply, stopSpeaking }

        return (
          <div className="flex-1 flex flex-col" style={{ height: '100vh', overflow: 'hidden' }}>
            <TopBar
              title="AI Chat"
              subtitle={mode === 'rag' ? 'Answering from your uploaded documents' : 'Your farming assistant'}
            />

            {/* Toolbar */}
            <div
              className="flex items-center gap-3 px-6 py-3 flex-wrap"
              style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface)' }}
            >
              <div className="tab-list">
                <button onClick={() => setMode('chat')} className={`tab-item ${mode === 'chat' ? 'active' : ''}`}>
                  <MessageSquare size={14} strokeWidth={2} />General Chat
                </button>
                <button onClick={() => setMode('rag')} className={`tab-item ${mode === 'rag' ? 'active' : ''}`}>
                  <FileSearch size={14} strokeWidth={2} />Document Q&amp;A
                </button>
              </div>

              <div className="flex items-center gap-1 ml-auto">
                <VoiceInputButton isListening={voiceIsListening} isProcessing={loading} disabled={loading} onClick={toggleVoice} />
                <div className="w-px h-6 mx-1" style={{ background: 'var(--color-border)' }} />
                <button onClick={startNewSession} title="New session" className="btn btn-ghost btn-icon btn-sm"><Plus size={15} /></button>
                <button onClick={saveCurrentSession} title="Save session" className="btn btn-ghost btn-icon btn-sm"><Save size={15} /></button>
                <button
                  onClick={() => setShowSessions(!showSessions)}
                  className="btn btn-ghost btn-icon btn-sm"
                  style={showSessions ? { background: 'rgba(16,185,129,0.1)', color: 'var(--color-primary)' } : {}}
                >
                  <FolderOpen size={15} />
                </button>
                <div className="relative">
                  <button onClick={() => setShowExport(!showExport)} className="btn btn-ghost btn-icon btn-sm"><Download size={15} /></button>
                  {showExport && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowExport(false)} />
                      <div className="dropdown-menu right-0 top-full mt-2 z-50">
                        {['json', 'csv', 'pdf'].map(f => (
                          <button key={f} onClick={() => handleExport(f)} className="dropdown-item uppercase text-xs tracking-wider">{f}</button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Sessions Panel */}
            {showSessions && (
              <div className="animate-slide-left" style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface-2)', padding: '14px 24px' }}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>Chat Sessions</p>
                  <button onClick={() => setShowSessions(false)} className="btn btn-ghost btn-icon btn-sm"><X size={14} /></button>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {sessions.length === 0 ? (
                    <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>No saved sessions yet.</span>
                  ) : sessions.map(s => (
                    <div
                      key={s.session_id}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm border cursor-pointer transition-all duration-150"
                      style={{
                        background: s.session_id === sessionId ? 'rgba(16,185,129,0.1)' : 'var(--color-surface)',
                        borderColor: s.session_id === sessionId ? 'rgba(16,185,129,0.3)' : 'var(--color-border)',
                        color: s.session_id === sessionId ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                      }}
                      onClick={() => switchSession(s.session_id)}
                    >
                      <Clock size={12} />
                      <span className="font-medium text-xs">{s.name || 'Unnamed'}</span>
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteSession(s.session_id) }} className="ml-1 opacity-50 hover:opacity-100"><Trash2 size={11} /></button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 md:px-8 lg:px-12">
              <div className="max-w-4xl mx-auto flex flex-col gap-5">
                {interimText && (
                  <div className="flex justify-end animate-fade-up">
                    <div className="chat-bubble-user opacity-70 italic">{interimText}...</div>
                  </div>
                )}

                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex gap-4 animate-fade-up ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                    style={{ animationDelay: `${Math.min(index, 5) * 40}ms` }}
                  >
                    {message.role === 'assistant' ? (
                      <div className="flex items-center justify-center rounded-2xl flex-shrink-0" style={{ width: 38, height: 38, background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 4px 12px rgba(16,185,129,0.3)' }}>
                        <Bot size={18} className="text-white" strokeWidth={1.75} />
                      </div>
                    ) : (
                      <div className="flex items-center justify-center rounded-full flex-shrink-0" style={{ width: 38, height: 38, background: 'var(--color-surface-3)', border: '2px solid var(--color-border)' }}>
                        <User size={16} style={{ color: 'var(--color-text-muted)' }} strokeWidth={2} />
                      </div>
                    )}

                    <div style={{ maxWidth: '72%', display: 'flex', flexDirection: 'column', gap: 6, alignItems: message.role === 'user' ? 'flex-end' : 'flex-start' }}>
                      {message.role === 'assistant' ? (
                        <div className="chat-bubble-assistant relative group">
                          <span className="whitespace-pre-wrap leading-relaxed text-sm">{message.content}</span>
                          {message.content && (
                            <div className="absolute -right-2 -bottom-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <VoiceOutputButton
                                isSpeaking={voiceIsSpeaking}
                                disabled={loading}
                                onClick={() => voiceIsSpeaking ? stopSpeaking() : speakReply(message.content, uiLanguage)}
                                className="shadow-md"
                              />
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="chat-bubble-user">{message.content}</div>
                      )}
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className="flex gap-4 animate-fade-up">
                    <div className="flex items-center justify-center rounded-2xl flex-shrink-0" style={{ width: 38, height: 38, background: 'var(--color-surface-3)', border: '1px solid var(--color-border)' }}>
                      <Bot size={18} style={{ color: 'var(--color-text-muted)' }} strokeWidth={1.75} />
                    </div>
                    <div className="chat-bubble-assistant">
                      <div className="loading-dots"><span /><span /><span /></div>
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
            </div>

            {/* Input Area */}
            <div style={{ borderTop: '1px solid var(--color-border)', background: 'var(--color-surface)', padding: '16px 24px 20px' }}>
              <div className="max-w-4xl mx-auto">
                <div
                  className="flex gap-3 items-end"
                  style={{ background: 'var(--color-surface-2)', border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-xl)', padding: '8px 8px 8px 16px' }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-primary)' }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)' }}
                >
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={mode === 'rag' ? 'Ask a question about your uploaded documents...' : 'Ask about crops, soil, pests, irrigation...'}
                    rows={1}
                    style={{ flex: 1, resize: 'none', background: 'transparent', border: 'none', outline: 'none', fontFamily: 'inherit', fontSize: '0.9rem', color: 'var(--color-text)', lineHeight: 1.6, paddingTop: 6 }}
                    onInput={(e) => { e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px' }}
                  />
                  <button
                    onClick={send}
                    disabled={loading || !input.trim()}
                    className="btn btn-primary btn-icon flex-shrink-0"
                    style={{ width: 42, height: 42, borderRadius: 'var(--radius-lg)', opacity: (!input.trim() || loading) ? 0.5 : 1 }}
                  >
                    <SendHorizontal size={17} strokeWidth={2} />
                  </button>
                </div>
                <p className="text-[11px] mt-2 text-center" style={{ color: 'var(--color-text-muted)' }}>
                  {voiceIsListening ? 'Listening... tap mic to stop' : 'Enter to send · Shift+Enter for new line · tap mic to speak'}
                </p>
              </div>
            </div>
          </div>
        )
      }}
    </SpeechPipeline>
  )
}
