import { useState, useEffect } from 'react'
import { engineApi } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { Zap, Activity, TrendingDown } from 'lucide-react'
import clsx from 'clsx'

export default function ReadinessDisplay() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  
  const subject = user?.subjects?.[0]?.name || 'General'

  useEffect(() => {
    engineApi.getReadiness(subject).then(res => {
      setData(res.data?.data)
    }).catch(() => {})
    .finally(() => setLoading(false))
  }, [subject])

  if (loading || !data) return null
  
  const pct = Math.max(0, Math.min(100, Math.round(data.readinessScore)))
  const color = pct >= 80 ? 'text-sage-600' : pct >= 50 ? 'text-blue-600' : 'text-amber-600'
  const isDecaying = (data.components?.decayPenalty || 0) > 0

  return (
    <div className="card p-5 fade-in">
      <div className="flex justify-between items-center mb-4">
        <h2 className="section-title flex items-center gap-1.5"><Zap size={15} className="text-gray-400" /> Topic Readiness</h2>
        <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">{subject}</span>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <span className={clsx("text-4xl font-bold tracking-tight leading-none", color)}>
           {pct}%
        </span>
        <div className="flex-1">
          <p className="text-xs text-gray-500 font-medium">Optimal capability</p>
          <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden mt-1.5">
            <div className={clsx("h-full transition-all duration-1000", color.replace('text', 'bg'))} style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>

      <div className="space-y-2 mt-4 text-xs font-medium">
        <div className="flex justify-between items-center text-gray-500">
           <span>Mastery index</span>
           <span className="text-gray-900">{(data.components?.mastery || 0).toFixed(1)} ⚡</span>
        </div>
        <div className="flex justify-between items-center text-gray-500">
           <span>Activity level</span>
           <span className="text-gray-900">{(data.components?.activity || 0).toFixed(1)} ⏱</span>
        </div>
        <div className="flex justify-between items-center pt-2 border-t border-gray-100">
           <span className={clsx("text-gray-500", isDecaying && "text-red-500")}>Decay rate</span>
           <span className={clsx("font-semibold flex items-center gap-1", isDecaying ? "text-red-500" : "text-gray-900")}>
             {isDecaying && <TrendingDown size={12} />} -{(data.components?.decayPenalty || 0).toFixed(1)}%
           </span>
        </div>
      </div>
    </div>
  )
}
