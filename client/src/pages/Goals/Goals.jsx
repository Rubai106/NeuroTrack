import { useState, useEffect } from 'react'
import { goalApi } from '../../services/api'
import Modal from '../../components/ui/Modal'
import ProgressBar from '../../components/ui/ProgressBar'
import EmptyState from '../../components/ui/EmptyState'
import Spinner from '../../components/ui/Spinner'
import { Plus, Trash2, CheckCircle, Target, Calendar } from 'lucide-react'
import toast from 'react-hot-toast'
import { format, formatDistanceToNow } from 'date-fns'
import clsx from 'clsx'

const TYPE_CONFIG = {
  daily:   { label: 'Daily',   color: 'bg-blue-50 text-blue-600',   dot: 'bg-blue-500' },
  weekly:  { label: 'Weekly',  color: 'bg-purple-50 text-purple-600', dot: 'bg-purple-500' },
  monthly: { label: 'Monthly', color: 'bg-amber-50 text-amber-600',  dot: 'bg-amber-500' },
  exam:    { label: 'Exam',    color: 'bg-red-50 text-red-600',      dot: 'bg-red-500' },
}

function formatMins(m) {
  const h = Math.floor(m / 60), r = m % 60
  return h ? `${h}h${r ? ` ${r}m` : ''}` : `${r}m`
}

export default function Goals() {
  const [goals, setGoals] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('active')
  const [modalOpen, setModalOpen] = useState(false)
  const [progressModal, setProgressModal] = useState(null)
  const [form, setForm] = useState({ title: '', type: 'daily', subject: 'All', targetMinutes: 120, examDate: '', examName: '' })
  const [progressMins, setProgressMins] = useState(30)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res = await goalApi.getAll()
      setGoals(res.data.data || [])
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const set = k => e => setForm(p => ({...p, [k]: e.target.type === 'number' ? +e.target.value : e.target.value}))

  const handleCreate = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await goalApi.create(form)
      toast.success('Goal created!')
      setModalOpen(false)
      setForm({ title: '', type: 'daily', subject: 'All', targetMinutes: 120, examDate: '', examName: '' })
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed')
    } finally { setSaving(false) }
  }

  const handleProgress = async () => {
    if (!progressModal) return
    await goalApi.updateProgress(progressModal._id, progressMins)
    toast.success('Progress updated!')
    setProgressModal(null)
    load()
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this goal?')) return
    await goalApi.delete(id)
    setGoals(p => p.filter(g => g._id !== id))
    toast.success('Goal deleted')
  }

  const filtered = goals.filter(g =>
    tab === 'active' ? g.status === 'active' :
    tab === 'completed' ? g.status === 'completed' : true
  )

  return (
    <div className="px-6 py-6 max-w-3xl mx-auto fade-in">
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Goals</h1>
          <p className="text-sm text-gray-500 mt-0.5">Track your study targets</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="btn-primary flex items-center gap-1.5">
          <Plus size={15} /> New goal
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-gray-100 rounded-lg p-1 w-fit">
        {['active', 'completed', 'all'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={clsx('px-4 py-1.5 rounded-md text-sm font-medium transition-all',
              tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700')}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon="🎯" title="No goals yet"
          description="Set daily, weekly, or exam goals to stay on track"
          action={<button onClick={() => setModalOpen(true)} className="btn-primary">Create goal</button>}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map(g => {
            const cfg = TYPE_CONFIG[g.type] || TYPE_CONFIG.daily
            const pct = g.progressPercent || 0
            const done = g.status === 'completed'
            return (
              <div key={g._id} className={clsx('card p-5 group', done && 'opacity-70')}>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-start gap-2.5">
                    {done
                      ? <CheckCircle size={18} className="text-sage-500 mt-0.5 shrink-0" />
                      : <Target size={18} className="text-gray-400 mt-0.5 shrink-0" />
                    }
                    <div>
                      <p className="text-sm font-medium text-gray-800">{g.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={clsx('badge', cfg.color)}>{cfg.label}</span>
                        {g.subject !== 'All' && <span className="text-xs text-gray-400">{g.subject}</span>}
                        {g.examDate && (
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Calendar size={10} />
                            {formatDistanceToNow(new Date(g.examDate), { addSuffix: true })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!done && (
                      <button onClick={() => { setProgressModal(g); setProgressMins(30) }}
                        className="text-xs px-2.5 py-1 bg-sage-50 text-sage-600 rounded-lg hover:bg-sage-100 transition-colors">
                        + Progress
                      </button>
                    )}
                    <button onClick={() => handleDelete(g._id)}
                      className="text-gray-300 hover:text-red-400 p-1 rounded transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <ProgressBar value={g.currentMinutes || 0} max={g.targetMinutes}
                  color={done ? 'sage' : pct >= 75 ? 'sage' : pct >= 40 ? 'blue' : 'amber'}
                  size="md" />

                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-gray-400">
                    {formatMins(g.currentMinutes || 0)} / {formatMins(g.targetMinutes)}
                  </span>
                  <span className={clsx('text-xs font-medium', done ? 'text-sage-600' : 'text-gray-500')}>
                    {done ? '✓ Completed' : `${pct}%`}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Create goal modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Create goal">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="label">Title</label>
            <input className="input" placeholder="e.g. Study Math 2hrs daily" value={form.title} onChange={set('title')} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Type</label>
              <select className="input" value={form.type} onChange={set('type')}>
                {Object.keys(TYPE_CONFIG).map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Subject</label>
              <input className="input" placeholder="All" value={form.subject} onChange={set('subject')} />
            </div>
          </div>
          <div>
            <label className="label">Target (minutes)</label>
            <input type="number" className="input" min="1" value={form.targetMinutes} onChange={set('targetMinutes')} />
          </div>
          {form.type === 'exam' && (
            <>
              <div>
                <label className="label">Exam name</label>
                <input className="input" value={form.examName} onChange={set('examName')} placeholder="Final Semester Exam" />
              </div>
              <div>
                <label className="label">Exam date</label>
                <input type="date" className="input" value={form.examDate} onChange={set('examDate')} />
              </div>
            </>
          )}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? 'Creating…' : 'Create goal'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Progress update modal */}
      <Modal open={!!progressModal} onClose={() => setProgressModal(null)} title="Update progress" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">How many minutes did you study for <strong>{progressModal?.title}</strong>?</p>
          <input type="number" className="input" min="1" value={progressMins}
            onChange={e => setProgressMins(+e.target.value)} />
          <div className="flex gap-2">
            <button onClick={() => setProgressModal(null)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={handleProgress} className="btn-primary flex-1">Save</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
