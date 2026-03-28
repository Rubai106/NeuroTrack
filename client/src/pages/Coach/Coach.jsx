import { useState, useRef, useEffect } from 'react'
import { coachApi } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { Send, Bot, User, Sparkles } from 'lucide-react'
import Spinner from '../../components/ui/Spinner'
import clsx from 'clsx'

const SUGGESTIONS = [
  'What should I study next?',
  'How am I doing this week?',
  'Help me plan for my exam',
  "I'm feeling tired and burnt out",
  'How can I improve my focus?',
]

function Message({ msg }) {
  const isUser = msg.role === 'user'
  return (
    <div className={clsx('flex gap-3 fade-in', isUser && 'flex-row-reverse')}>
      <div className={clsx('w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5',
        isUser ? 'bg-sage-100 text-sage-700' : 'bg-gray-100 text-gray-600')}>
        {isUser ? <User size={14} /> : <Bot size={14} />}
      </div>
      <div className={clsx('max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
        isUser
          ? 'bg-sage-600 text-white rounded-tr-sm'
          : 'bg-white border border-gray-100 text-gray-800 rounded-tl-sm shadow-sm')}>
        {msg.text.split('\n').map((line, i) => {
          // Bold markdown **text**
          const parts = line.split(/\*\*(.*?)\*\*/g)
          return (
            <p key={i} className={i > 0 ? 'mt-1.5' : ''}>
              {parts.map((part, j) =>
                j % 2 === 1 ? <strong key={j} className="font-semibold">{part}</strong> : part
              )}
            </p>
          )
        })}
      </div>
    </div>
  )
}

const INITIAL_MSG = {
  role: 'assistant',
  text: "Hey! I'm your NeuroTrack Study Coach 🧠\n\nI can help you with:\n- **What to study next** based on your weaknesses\n- **Performance analysis** and trend insights\n- **Revision planning** before exams\n- **Motivation** when you're feeling stuck\n\nWhat's on your mind today?"
}

export default function Coach() {
  const { user } = useAuth()
  const [messages, setMessages] = useState([INITIAL_MSG])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (text) => {
    const msg = text || input.trim()
    if (!msg || loading) return
    setInput('')
    setMessages(p => [...p, { role: 'user', text: msg }])
    setLoading(true)
    try {
      const res = await coachApi.message(msg)
      setMessages(p => [...p, { role: 'assistant', text: res.data.data.text }])
    } catch {
      setMessages(p => [...p, { role: 'assistant', text: "Sorry, I'm having trouble connecting right now. Please try again in a moment." }])
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-0px)] lg:h-screen max-h-screen">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 bg-white shrink-0">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-sage-100 flex items-center justify-center">
            <Sparkles size={18} className="text-sage-600" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-gray-900">Study Coach</h1>
            <p className="text-xs text-gray-400">Rule-based AI · context-aware</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-sage-400 animate-pulse" />
            <span className="text-xs text-gray-400">Active</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.map((m, i) => <Message key={i} msg={m} />)}
          {loading && (
            <div className="flex gap-3 fade-in">
              <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                <Bot size={14} className="text-gray-500" />
              </div>
              <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                <div className="flex gap-1.5 items-center h-4">
                  {[0,1,2].map(i => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-bounce"
                      style={{ animationDelay: `${i * 150}ms` }} />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Suggestions */}
      {messages.length <= 1 && (
        <div className="px-6 pb-3 shrink-0">
          <div className="max-w-3xl mx-auto">
            <p className="text-xs text-gray-400 mb-2">Try asking</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map(s => (
                <button key={s} onClick={() => sendMessage(s)}
                  className="text-xs px-3 py-1.5 bg-white border border-gray-200 rounded-full text-gray-600 hover:border-sage-300 hover:text-sage-700 transition-all">
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="px-6 pb-5 pt-3 border-t border-gray-100 bg-white shrink-0">
        <div className="max-w-3xl mx-auto flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            rows={1}
            placeholder="Ask your study coach…"
            className="input resize-none flex-1 min-h-[42px] max-h-32 py-2.5"
            style={{ lineHeight: '1.5' }}
          />
          <button onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className="btn-primary px-3 py-2.5 flex items-center justify-center shrink-0 disabled:opacity-50 disabled:cursor-not-allowed">
            <Send size={15} />
          </button>
        </div>
        <p className="text-xs text-gray-300 text-center mt-2">Press Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  )
}
