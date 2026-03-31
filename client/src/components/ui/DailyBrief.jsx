import { useEffect, useState } from 'react'
import { engineApi } from '../../services/api'
import { Activity, AlertTriangle, ShieldCheck } from 'lucide-react'
import clsx from 'clsx'
import Spinner from './Spinner'

export default function DailyBrief() {
  const [brief, setBrief] = useState(null)
  const [loading, setLoading] = useState(true)
  const [dismissed, setDismissed] = useState(() => {
    const d = localStorage.getItem('nt_brief_dismissed')
    return d === new Date().toDateString()
  })

  useEffect(() => {
    if (dismissed) { setLoading(false); return }
    engineApi.getDailyBrief()
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

      <div className="mb-4">
        <p className="text-xs text-gray-400 font-medium tracking-wide uppercase">{brief.date}</p>
        <h3 className="text-sm font-semibold text-gray-900 mt-1 flex items-center gap-1.5">
           <Activity size={16} className="text-blue-500" />
           System Initialization State
        </h3>
      </div>

      <div className="space-y-3 bg-gray-50/50 p-3 rounded-lg border border-gray-100">
        <div className="flex items-start gap-2.5">
          <span className="mt-0.5 text-sage-500"><ShieldCheck size={16} /></span>
          <div>
            <p className="text-xs font-semibold text-gray-800 uppercase tracking-wider mb-0.5">Engine Status</p>
            <p className="text-sm text-gray-600 leading-snug">{brief.summary?.state || 'Normal operations.'}</p>
          </div>
        </div>

        {brief.summary?.risks?.length > 0 && brief.summary.risks.map((risk, i) => (
          <div key={i} className="flex items-start gap-2.5 pt-3 border-t border-gray-100">
            <span className="mt-0.5 text-amber-500"><AlertTriangle size={16} /></span>
            <div>
              <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-0.5">Detected Risk</p>
              <p className="text-sm text-gray-700 leading-snug">{risk}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between gap-3 mt-4 pt-3 border-t border-gray-100">
        <p className="text-xs text-gray-500"><span className="font-semibold text-gray-700">Recommendation:</span> {brief.summary?.focusRecommendation}</p>
      </div>
    </div>
  )
}
