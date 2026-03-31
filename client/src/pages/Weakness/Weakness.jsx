import { useState, useEffect } from 'react'
import { weaknessApi } from '../../services/api'
import Modal from '../../components/ui/Modal'
import ProgressBar from '../../components/ui/ProgressBar'
import EmptyState from '../../components/ui/EmptyState'
import Spinner from '../../components/ui/Spinner'
import ConfidenceGraph from '../../components/charts/ConfidenceGraph'
import { Plus, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'

function getWeaknessLevel(score) {
  if (score >= 70) return { label: 'Critical', color: 'text-red-600', bg: 'bg-red-50 border-red-100', bar: 'red' }
  if (score >= 40) return { label: 'Moderate', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100', bar: 'amber' }
  return { label: 'Low', color: 'text-sage-600', bg: 'bg-sage-50 border-sage-100', bar: 'sage' }
}

export default function Weakness() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [quizModal, setQuizModal] = useState(false)
  const [tab, setTab] = useState('ranked') // 'ranked' | 'confidence'
  const [form, setForm] = useState({ subject: '', topic: '', score: '', totalQuestions: 10, timeTakenMinutes: 10 })
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res = await weaknessApi.getAll()
      setData(res.data.data || [])
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.type === 'number' ? +e.target.value : e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (+form.score > +form.totalQuestions) { toast.error('Score cannot exceed total questions'); return }
    setSaving(true)
    try {
      await weaknessApi.addQuiz({ ...form, score: +form.score })
      toast.success('Quiz result recorded! +25 XP')
      setQuizModal(false)
      setForm({ subject: '', topic: '', score: '', totalQuestions: 10, timeTakenMinutes: 10 })
      load()
    } catch { toast.error('Failed to save') } finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Remove this entry?')) return
    await weaknessApi.delete(id)
    setData(p => p.filter(d => d._id !== id))
    toast.success('Entry removed')
  }

  const critical = data.filter(d => d.weaknessScore >= 70)
  const moderate = data.filter(d => d.weaknessScore >= 40 && d.weaknessScore < 70)
  const strong   = data.filter(d => d.weaknessScore < 40)

  return (
    <div className="px-6 py-6 max-w-4xl mx-auto fade-in">
      {/* Header */}
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Weakness Analyzer</h1>
          <p className="text-sm text-gray-500 mt-0.5">Track quiz results to identify gaps</p>
        </div>
        <button onClick={() => setQuizModal(true)} className="btn-primary flex items-center gap-1.5">
          <Plus size={15} /> Log quiz result
        </button>
      </div>

      {/* Summary */}
      {data.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="card p-4 text-center">
            <p className="text-2xl font-semibold text-red-500">{critical.length}</p>
            <p className="text-xs text-gray-500 mt-0.5">Critical</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-2xl font-semibold text-amber-500">{moderate.length}</p>
            <p className="text-xs text-gray-500 mt-0.5">Moderate</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-2xl font-semibold text-sage-600">{strong.length}</p>
            <p className="text-xs text-gray-500 mt-0.5">Strong</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      {data.length > 0 && (
        <div className="flex gap-1 mb-5 bg-gray-100 rounded-lg p-1 w-fit">
          {[['ranked', 'Ranked list'], ['confidence', 'Confidence graph']].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)}
              className={clsx('px-4 py-1.5 rounded-md text-sm font-medium transition-all',
                tab === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700')}>
              {label}
            </button>
          ))}
        </div>
      )}

      {loading && data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <Spinner size="lg" />
          <p className="text-xs text-gray-400 animate-pulse">Analyzing weaknesses...</p>
        </div>
      ) : data.length === 0 ? (
        <EmptyState icon="🎯" title="No quiz results yet"
          description="Log your quiz results to get a ranked list of topics that need more attention"
          action={<button onClick={() => setQuizModal(true)} className="btn-primary">Log first result</button>}
        />
      ) : tab === 'confidence' ? (
        /* Confidence Graph tab */
        <div className="card p-5">
          <ConfidenceGraph weaknesses={data} />
        </div>
      ) : (
        /* Ranked list tab */
        <div className="space-y-3">
          {data.map((item, i) => {
            const lvl = getWeaknessLevel(item.weaknessScore)
            const accuracy = item.totalAttempts > 0
              ? Math.round(((item.totalAttempts - item.wrongAttempts) / item.totalAttempts) * 100)
              : 0

            // Overconfidence flag
            const mastery = 100 - item.weaknessScore
            const gap = (item.confidenceScore || 50) - mastery
            const overconfident = gap > 25
            const underconfident = gap < -25

            return (
              <div key={item._id} className={clsx('card p-4 border group', lvl.bg)}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center text-xs font-mono font-semibold text-gray-500 shrink-0 mt-0.5">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-gray-800">{item.topic}</span>
                        <span className="text-xs text-gray-400">{item.subject}</span>
                        <span className={clsx('badge bg-white', lvl.color)}>{lvl.label}</span>
                        {overconfident && <span className="badge bg-red-50 text-red-500">⚠ Overconfident</span>}
                        {underconfident && <span className="badge bg-blue-50 text-blue-500">💡 Underrated</span>}
                      </div>

                      <div className="mt-2.5">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-500">Weakness score</span>
                          <span className={clsx('text-xs font-semibold', lvl.color)}>{item.weaknessScore}/100</span>
                        </div>
                        <ProgressBar value={item.weaknessScore} max={100} color={lvl.bar} size="sm" />
                      </div>

                      <div className="flex items-center gap-4 mt-2.5 flex-wrap text-xs text-gray-500">
                        <span>Accuracy: <strong className="text-gray-700">{accuracy}%</strong></span>
                        <span>Attempts: <strong className="text-gray-700">{item.totalAttempts}</strong></span>
                        <span>Confidence: <strong className="text-gray-700">{item.confidenceScore}/100</strong></span>
                        <span>Study: <strong className="text-gray-700">{(item.studyWeightHours || 0).toFixed(1)}h</strong></span>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => handleDelete(item._id)}
                    className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all p-1 rounded shrink-0">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Log quiz modal */}
      <Modal open={quizModal} onClose={() => setQuizModal(false)} title="Log quiz result">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Subject</label>
              <input className="input" placeholder="Mathematics" value={form.subject} onChange={set('subject')} required />
            </div>
            <div>
              <label className="label">Topic</label>
              <input className="input" placeholder="Integration" value={form.topic} onChange={set('topic')} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Your score</label>
              <input type="number" className="input" min="0" placeholder="e.g. 7"
                value={form.score} onChange={set('score')} required />
            </div>
            <div>
              <label className="label">Total questions</label>
              <input type="number" className="input" min="1" value={form.totalQuestions} onChange={set('totalQuestions')} />
            </div>
          </div>
          <div>
            <label className="label">Time taken (minutes)</label>
            <input type="number" className="input" min="1" value={form.timeTakenMinutes} onChange={set('timeTakenMinutes')} />
          </div>
          {form.score !== '' && form.totalQuestions > 0 && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600">
                Score: <strong>{Math.round((+form.score / +form.totalQuestions) * 100)}%</strong>
                {' — '}
                {+form.score / +form.totalQuestions >= 0.7 ? '✅ Good job!' : +form.score / +form.totalQuestions >= 0.5 ? '⚠️ Needs review' : '❌ Urgent attention needed'}
              </p>
            </div>
          )}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={() => setQuizModal(false)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? 'Saving…' : 'Save result'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
