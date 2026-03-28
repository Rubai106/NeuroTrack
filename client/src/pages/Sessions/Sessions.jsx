import { useState, useEffect } from 'react'
import { sessionApi } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import Modal from '../../components/ui/Modal'
import PomodoroTimer from '../../components/ui/PomodoroTimer'
import EmptyState from '../../components/ui/EmptyState'
import Spinner from '../../components/ui/Spinner'
import { Plus, Clock, Trash2, Timer, ChevronDown } from 'lucide-react'
import toast from 'react-hot-toast'
import { format, parseISO } from 'date-fns'
import clsx from 'clsx'

const DIFFICULTIES = ['easy', 'medium', 'hard']
const MOODS = ['great', 'good', 'okay', 'tired', 'stressed']
const SESSION_TYPES = ['manual', 'pomodoro', 'deep-work', 'review']

const DIFF_COLORS = { easy: 'bg-green-100 text-green-700', medium: 'bg-amber-100 text-amber-700', hard: 'bg-red-100 text-red-700' }

function formatMins(mins) {
  const h = Math.floor(mins / 60), m = mins % 60
  return h ? `${h}h ${m}m` : `${m}m`
}

const defaultForm = {
  subject: '', topic: '', durationMinutes: 60, difficulty: 'medium',
  focusQuality: 7, energyLevel: 3, distractionMinutes: 0,
  sessionType: 'manual', pomodoroCount: 0, mood: 'good', notes: ''
}

export default function Sessions() {
  const { user } = useAuth()
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [pomodoroOpen, setPomodoroOpen] = useState(false)
  const [form, setForm] = useState(defaultForm)
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState({ subject: '', days: 30 })

  const subjects = user?.subjects?.map(s => s.name) || []

  const load = async () => {
    setLoading(true)
    try {
      const params = {}
      if (filter.subject) params.subject = filter.subject
      const start = new Date(); start.setDate(start.getDate() - filter.days)
      params.startDate = start.toISOString()
      params.limit = 50
      const res = await sessionApi.getAll(params)
      setSessions(res.data.data || [])
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [filter])

  const set = (k) => (e) => setForm(p => ({...p, [k]: e.target.type === 'number' ? +e.target.value : e.target.value}))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.subject) { toast.error('Subject is required'); return }
    setSaving(true)
    try {
      await sessionApi.create({ ...form, date: new Date(), completedAt: new Date() })
      toast.success('Session logged! +20 XP')
      setModalOpen(false)
      setForm(defaultForm)
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save')
    } finally { setSaving(false) }
  }

  const deleteSession = async (id) => {
    if (!confirm('Delete this session?')) return
    await sessionApi.delete(id)
    setSessions(p => p.filter(s => s._id !== id))
    toast.success('Session deleted')
  }

  // Group by date
  const grouped = sessions.reduce((acc, s) => {
    const d = s.date ? format(new Date(s.date), 'yyyy-MM-dd') : 'unknown'
    if (!acc[d]) acc[d] = []
    acc[d].push(s)
    return acc
  }, {})

  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a))

  return (
    <div className="px-6 py-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Study Sessions</h1>
          <p className="text-sm text-gray-500 mt-0.5">{sessions.length} sessions tracked</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setPomodoroOpen(true)} className="btn-secondary flex items-center gap-1.5">
            <Timer size={15} /> Pomodoro
          </button>
          <button onClick={() => setModalOpen(true)} className="btn-primary flex items-center gap-1.5">
            <Plus size={15} /> Log session
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-5 flex-wrap">
        <select className="input w-auto text-sm pr-8"
          value={filter.subject} onChange={e => setFilter(p => ({...p, subject: e.target.value}))}>
          <option value="">All subjects</option>
          {subjects.map(s => <option key={s}>{s}</option>)}
        </select>
        <select className="input w-auto text-sm pr-8"
          value={filter.days} onChange={e => setFilter(p => ({...p, days: +e.target.value}))}>
          {[7, 14, 30, 90].map(d => <option key={d} value={d}>Last {d} days</option>)}
        </select>
      </div>

      {/* Sessions list */}
      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : sessions.length === 0 ? (
        <EmptyState icon="📚" title="No sessions yet"
          description="Log your first study session to start tracking your progress"
          action={<button onClick={() => setModalOpen(true)} className="btn-primary">Log session</button>}
        />
      ) : (
        <div className="space-y-5">
          {sortedDates.map(date => (
            <div key={date}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  {date === format(new Date(), 'yyyy-MM-dd') ? 'Today' :
                   date === format(new Date(Date.now() - 86400000), 'yyyy-MM-dd') ? 'Yesterday' :
                   format(new Date(date), 'EEEE, MMM d')}
                </span>
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-xs text-gray-400">
                  {formatMins(grouped[date].reduce((s, x) => s + x.durationMinutes, 0))}
                </span>
              </div>
              <div className="card divide-y divide-gray-50">
                {grouped[date].map(s => (
                  <div key={s._id} className="flex items-center justify-between px-4 py-3 group">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-sage-50 flex items-center justify-center text-sage-600 shrink-0">
                        <Clock size={15} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-800">{s.subject}</span>
                          <span className={clsx('badge', DIFF_COLORS[s.difficulty])}>{s.difficulty}</span>
                        </div>
                        <p className="text-xs text-gray-400">{s.topic} · {s.sessionType}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right hidden sm:block">
                        <p className="text-sm font-medium text-gray-700">{formatMins(s.durationMinutes)}</p>
                        <p className="text-xs text-gray-400">Focus {s.focusQuality}/10</p>
                      </div>
                      <button onClick={() => deleteSession(s._id)}
                        className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all p-1 rounded">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Log Session Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Log study session" size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="label">Subject *</label>
              <select className="input" value={form.subject} onChange={set('subject')} required>
                <option value="">Select subject</option>
                {subjects.map(s => <option key={s}>{s}</option>)}
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="label">Topic</label>
              <input className="input" placeholder="e.g. Calculus, Algorithms" value={form.topic} onChange={set('topic')} />
            </div>
            <div>
              <label className="label">Duration (mins)</label>
              <input type="number" className="input" min="1" max="480" value={form.durationMinutes} onChange={set('durationMinutes')} />
            </div>
            <div>
              <label className="label">Session type</label>
              <select className="input" value={form.sessionType} onChange={set('sessionType')}>
                {SESSION_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Difficulty</label>
              <select className="input" value={form.difficulty} onChange={set('difficulty')}>
                {DIFFICULTIES.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Mood</label>
              <select className="input" value={form.mood} onChange={set('mood')}>
                {MOODS.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Focus quality (1–10)</label>
              <input type="number" className="input" min="1" max="10" value={form.focusQuality} onChange={set('focusQuality')} />
            </div>
            <div>
              <label className="label">Distraction (mins)</label>
              <input type="number" className="input" min="0" value={form.distractionMinutes} onChange={set('distractionMinutes')} />
            </div>
            <div className="col-span-2">
              <label className="label">Notes (optional)</label>
              <textarea className="input resize-none" rows={2} placeholder="What did you cover?" value={form.notes} onChange={set('notes')} />
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? 'Saving…' : 'Log session'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Pomodoro Modal */}
      <Modal open={pomodoroOpen} onClose={() => setPomodoroOpen(false)} title="Pomodoro Timer" size="sm">
        <PomodoroTimer
          workMins={user?.preferences?.pomodoroWork || 25}
          breakMins={user?.preferences?.pomodoroBreak || 5}
          onPomodoroComplete={(count) => toast.success(`Pomodoro #${count} complete! +10 XP`)}
        />
      </Modal>
    </div>
  )
}
