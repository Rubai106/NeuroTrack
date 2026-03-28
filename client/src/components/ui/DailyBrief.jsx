import { useEffect, useState } from 'react'
import { insightsApi } from '../../services/api'
import Spinner from './Spinner'
import clsx from 'clsx'

export default function DailyBrief() {
  const [brief, setBrief] = useState(null)
  const [loading, setLoading] = useState(true)
  const [dismissed, setDismissed] = useState(() => {
    const d = localStorage.getItem('nt_brief_dismissed')
    return d === new Date().toDateString()
  })

  useEffect(() => {
    if (dismissed) { setLoading(false); return }
    insightsApi.getDailyBrief()
      .then(r => setBrief(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [dismissed])

  const dismiss = () => {
    localStorage.setItem('nt_brief_dismissed', new Date().toDateString())
    setDismissed(true)
  }

  if (dismissed || loading || !brief) return null

  return (
    <div className="card p-5 border-l-4 border-l-sage-500 mb-5 fade-in relative">
      <button onClick={dismiss}
        className="absolute top-3 right-3 text-gray-300 hover:text-gray-500 text-lg leading-none">×</button>

      <div className="mb-3">
        <p className="text-xs text-gray-400 font-medium">{brief.date}</p>
        <h3 className="text-sm font-semibold text-gray-900 mt-0.5">Today's plan</h3>
      </div>

      <div className="space-y-2.5">
        {brief.actions.map((action, i) => (
          <div key={i} className="flex items-start gap-2.5">
            <span className="text-base leading-tight mt-0.5">{action.icon}</span>
            <div>
              <p className="text-sm font-medium text-gray-800 leading-snug">{action.text}</p>
              <p className="text-xs text-gray-400 mt-0.5">{action.reason}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 mt-4 pt-3 border-t border-gray-100">
        {brief.streak > 0 && (
          <span className="text-xs text-amber-600 font-medium">🔥 {brief.streak}-day streak</span>
        )}
        {brief.examDays !== null && brief.examDays >= 0 && (
          <span className="text-xs text-red-500 font-medium">📅 {brief.examDays} days to exam</span>
        )}
      </div>
    </div>
  )
}
