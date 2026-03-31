import { useState, useEffect } from 'react'
import { engineApi } from '../../services/api'
import { AlertTriangle, Cpu } from 'lucide-react'
import clsx from 'clsx'

export default function CognitiveLoadMeter() {
  const [load, setLoad] = useState(0)
  const [state, setState] = useState('DeepFocus')

  useEffect(() => {
    const fetchLoad = () => {
      engineApi.getBehaviorProfile().then(res => {
        if (res.data?.data) {
           setLoad(res.data.data.metrics?.cognitiveLoad || 0)
           setState(res.data.data.currentState || 'DeepFocus')
        }
      }).catch(() => {})
    }
    fetchLoad()
    const interval = setInterval(fetchLoad, 10000)
    return () => clearInterval(interval)
  }, [])

  const pct = Math.min(100, Math.max(0, load))
  const color = pct > 85 ? 'bg-red-500' : pct > 60 ? 'bg-amber-500' : 'bg-cyan-500'
  const isHigh = pct > 80

  return (
    <div className="w-full bg-[#111827] border border-gray-800 rounded-xl p-4 mb-6 shadow-md relative overflow-hidden col-span-full fade-in">
      <div className="flex items-center justify-between mb-2 relative z-10">
         <div className="flex items-center gap-2">
            <Cpu size={16} className="text-gray-400" />
            <span className="text-sm font-semibold text-gray-200 uppercase tracking-widest">Cognitive Load Matrix</span>
         </div>
         <span className="text-sm font-mono text-gray-300">{Math.round(pct)}% — {state}</span>
      </div>
      
      <div className="h-1.5 w-full bg-gray-900 rounded-full overflow-hidden mb-1">
         <div 
            className={clsx("h-full transition-all duration-1000", color, isHigh && "animate-pulse")}
            style={{ width: `${pct}%` }} 
         />
      </div>

      {isHigh && (
        <div className="flex items-center gap-1.5 text-xs text-amber-400 mt-2 relative z-10">
           <AlertTriangle size={14} />
           <span>Capacity reaching limits. Switch to review tasks to prevent burnout.</span>
        </div>
      )}
    </div>
  )
}
