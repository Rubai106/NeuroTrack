import { useEffect, useState } from 'react'
import { insightsApi } from '../../services/api'
import clsx from 'clsx'

const TYPE_STYLES = {
  warning:  { card: 'bg-amber-50 border-amber-100', text: 'text-amber-800', sub: 'text-amber-600' },
  positive: { card: 'bg-sage-50 border-sage-100',   text: 'text-sage-800',  sub: 'text-sage-600'  },
  pattern:  { card: 'bg-blue-50 border-blue-100',   text: 'text-blue-800',  sub: 'text-blue-600'  },
  tip:      { card: 'bg-gray-50 border-gray-200',   text: 'text-gray-800',  sub: 'text-gray-500'  },
}

export default function InsightsFeed() {
  const [insights, setInsights] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    insightsApi.getInsights()
      .then(r => setInsights(r.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading || insights.length === 0) return null

  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-sm font-semibold text-gray-700">Insights</h2>
        <div className="flex-1 h-px bg-gray-100" />
        <span className="text-xs text-gray-400">{insights.length} today</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {insights.map((ins) => {
          const s = TYPE_STYLES[ins.type] || TYPE_STYLES.tip
          return (
            <div key={ins.id} className={clsx('rounded-xl border p-3.5 fade-in', s.card)}>
              <div className="flex items-start gap-2.5">
                <span className="text-lg leading-none mt-0.5 shrink-0">{ins.icon}</span>
                <div className="min-w-0">
                  <p className={clsx('text-xs font-semibold leading-snug', s.text)}>{ins.title}</p>
                  <p className={clsx('text-xs mt-1 leading-relaxed', s.sub)}>{ins.detail}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
