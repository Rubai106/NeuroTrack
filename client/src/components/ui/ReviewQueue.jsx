import { useEffect, useState } from 'react'
import { insightsApi } from '../../services/api'
import { CheckCircle, BookOpen } from 'lucide-react'
import clsx from 'clsx'
import toast from 'react-hot-toast'

const urgencyLabel = (u) => u >= 70 ? { label: 'Urgent', color: 'text-red-600 bg-red-50' }
  : u >= 40 ? { label: 'Due', color: 'text-amber-600 bg-amber-50' }
  : { label: 'Review', color: 'text-blue-600 bg-blue-50' }

export default function ReviewQueue() {
  const [queue, setQueue] = useState([])
  const [done, setDone] = useState(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    insightsApi.getReviewQueue()
      .then(r => setQueue(r.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const markDone = (id) => {
    setDone(p => new Set([...p, id]))
    toast.success('Marked as reviewed! +10 XP')
  }

  const remaining = queue.filter(q => !done.has(q._id))

  if (loading || queue.length === 0) return null

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="section-title">Review Queue</h2>
          {done.size > 0 && (
            <span className="text-xs text-sage-600 font-medium">{done.size}/{queue.length} done</span>
          )}
        </div>
        <BookOpen size={15} className="text-gray-400" />
      </div>

      {remaining.length === 0 ? (
        <div className="text-center py-4">
          <span className="text-2xl">🎉</span>
          <p className="text-sm text-sage-600 font-medium mt-1">All reviewed for today!</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {remaining.map(item => {
            const urg = urgencyLabel(item.urgency)
            return (
              <div key={item._id}
                className="flex items-center justify-between gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100 group">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="text-sm font-medium text-gray-800">{item.topic}</span>
                    <span className={clsx('badge text-[10px]', urg.color)}>{urg.label}</span>
                  </div>
                  <p className="text-xs text-gray-400">
                    {item.subject}
                    {item.daysSince > 0 && ` · last reviewed ${item.daysSince}d ago`}
                  </p>
                </div>
                <button onClick={() => markDone(item._id)}
                  className="shrink-0 w-7 h-7 rounded-full border-2 border-gray-200 flex items-center justify-center text-gray-300 hover:border-sage-400 hover:text-sage-500 transition-all group-hover:border-gray-300">
                  <CheckCircle size={14} />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
