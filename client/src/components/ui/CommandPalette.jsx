import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, LayoutDashboard, Clock, BarChart3, Target, FileText, AlertTriangle, Bot, Trophy, TrendingUp, Zap } from 'lucide-react'
import clsx from 'clsx'

const COMMANDS = [
  { id: 'dashboard',    label: 'Dashboard',      path: '/',             icon: LayoutDashboard, group: 'Pages' },
  { id: 'sessions',     label: 'Sessions',        path: '/sessions',     icon: Clock,           group: 'Pages' },
  { id: 'focus',        label: 'Focus Flow',       path: '/focus',        icon: Zap,             group: 'Pages' },
  { id: 'analytics',   label: 'Analytics',       path: '/analytics',    icon: BarChart3,        group: 'Pages' },
  { id: 'goals',        label: 'Goals',           path: '/goals',        icon: Target,           group: 'Pages' },
  { id: 'notes',        label: 'Notes',           path: '/notes',        icon: FileText,         group: 'Pages' },
  { id: 'weakness',     label: 'Weakness',        path: '/weakness',     icon: AlertTriangle,    group: 'Pages' },
  { id: 'predictions',  label: 'Predictions',     path: '/predictions',  icon: TrendingUp,       group: 'Pages' },
  { id: 'coach',        label: 'AI Coach',        path: '/coach',        icon: Bot,              group: 'Pages' },
  { id: 'achievements', label: 'Achievements',    path: '/gamification', icon: Trophy,           group: 'Pages' },
]

export default function CommandPalette({ open, onClose }) {
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const navigate = useNavigate()
  const inputRef = useRef(null)

  const filtered = query.trim()
    ? COMMANDS.filter(c => c.label.toLowerCase().includes(query.toLowerCase()))
    : COMMANDS

  useEffect(() => {
    if (open) {
      setQuery('')
      setActive(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  // Reset active index when results change
  useEffect(() => { setActive(0) }, [query])

  const go = useCallback((path) => {
    navigate(path)
    onClose()
  }, [navigate, onClose])

  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (e.key === 'Escape') { onClose(); return }
      if (e.key === 'ArrowDown') { e.preventDefault(); setActive(i => Math.min(i + 1, filtered.length - 1)) }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setActive(i => Math.max(i - 1, 0)) }
      if (e.key === 'Enter' && filtered[active]) { go(filtered[active].path) }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, active, filtered, go, onClose])

  if (!open) return null

  // Group results
  const groups = filtered.reduce((acc, cmd) => {
    if (!acc[cmd.group]) acc[cmd.group] = []
    acc[cmd.group].push(cmd)
    return acc
  }, {})

  let flatIdx = 0

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4">
      <div className="absolute inset-0 bg-black/25 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden fade-in border border-gray-100">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100">
          <Search size={16} className="text-gray-400 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Go to…"
            className="flex-1 text-sm text-gray-800 placeholder-gray-400 outline-none bg-transparent"
          />
          <kbd className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded font-mono">ESC</kbd>
        </div>

        {/* Results */}
        <div className="max-h-72 overflow-y-auto py-1.5">
          {filtered.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No results for "{query}"</p>
          ) : (
            Object.entries(groups).map(([group, items]) => (
              <div key={group}>
                {Object.keys(groups).length > 1 && (
                  <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide px-4 pt-2 pb-1">{group}</p>
                )}
                {items.map((cmd) => {
                  const idx = flatIdx++
                  const Icon = cmd.icon
                  return (
                    <button
                      key={cmd.id}
                      onClick={() => go(cmd.path)}
                      onMouseEnter={() => setActive(idx)}
                      className={clsx(
                        'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                        active === idx ? 'bg-sage-50' : 'hover:bg-gray-50'
                      )}
                    >
                      <div className={clsx('w-7 h-7 rounded-lg flex items-center justify-center shrink-0',
                        active === idx ? 'bg-sage-100 text-sage-600' : 'bg-gray-100 text-gray-500')}>
                        <Icon size={14} />
                      </div>
                      <span className={clsx('text-sm font-medium', active === idx ? 'text-sage-700' : 'text-gray-700')}>
                        {cmd.label}
                      </span>
                      {active === idx && (
                        <kbd className="ml-auto text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded font-mono">↵</kbd>
                      )}
                    </button>
                  )
                })}
              </div>
            ))
          )}
        </div>

        <div className="border-t border-gray-100 px-4 py-2 flex items-center gap-3">
          <span className="text-[10px] text-gray-400">↑↓ navigate</span>
          <span className="text-[10px] text-gray-400">↵ select</span>
          <span className="text-[10px] text-gray-400">esc close</span>
        </div>
      </div>
    </div>
  )
}
