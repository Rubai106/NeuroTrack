import { useState, useEffect } from 'react'
import { engineApi } from '../../services/api'
import { Terminal, CheckCircle2, AlertCircle } from 'lucide-react'
import clsx from 'clsx'

function buildSystemLogs(profile) {
  if (!profile) return []
  const metrics = profile.metrics || {}
  const cognitiveLoad = Number(metrics.cognitiveLoad || 0)
  const momentumIndex = Number(metrics.momentumIndex || 0)
  const consistencyScore = Number(metrics.consistencyScore || 0)

  const now = new Date().toLocaleTimeString()
  const logs = [
    { id: 1, time: now, type: 'info', msg: `Cognitive capacity evaluated: ${Math.round(cognitiveLoad)}/100.` },
    { id: 2, time: now, type: 'success', msg: `Momentum Index stabilized at ${momentumIndex.toFixed(2)}.` },
    { id: 3, time: now, type: 'info', msg: `Consistency tracker synced: Block #${consistencyScore}.` },
  ]

  if (profile.currentState === 'BurnoutPhase' || cognitiveLoad > 85) {
    logs.push({ id: 4, time: now, type: 'danger', msg: `CRITICAL: Overload detected. Burnout rules engaged.` })
  } else {
    logs.push({ id: 4, time: now, type: 'success', msg: `State normal. Ready for deep focus.` })
  }

  return logs.reverse()
}

export default function SystemFeed({ initialProfile = null }) {
  const [logs, setLogs] = useState([])
  
  useEffect(() => {
    if (initialProfile) {
      setLogs(buildSystemLogs(initialProfile))
      return
    }

    engineApi.getBehaviorProfile().then(res => {
      const profile = res.data?.data
      setLogs(buildSystemLogs(profile))
    }).catch(() => {})
  }, [initialProfile])

  return (
    <div className="mb-5 fade-in font-mono text-xs">
      <div className="flex items-center gap-2 mb-3 px-1">
        <Terminal size={14} className="text-gray-400" />
        <h2 className="font-semibold text-gray-600 uppercase tracking-widest">System Feed Output</h2>
        <div className="flex-1 h-px bg-gray-100" />
        <span className="text-[10px] text-sage-500 animate-pulse">● LIVE</span>
      </div>
      
      <div className="bg-gray-900/5 rounded-xl border border-gray-200/60 p-3 h-48 overflow-y-auto space-y-2.5">
        {logs.length === 0 ? (
          <p className="text-gray-400">Loading system matrix...</p>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="flex items-start gap-2 text-gray-700 animate-[fadeIn_0.5s_ease-out]">
               <span className="text-gray-400 shrink-0">[{log.time}]</span>
               <span className={clsx(
                  "shrink-0 mt-[1px]",
                  log.type === 'success' ? 'text-sage-500' : log.type === 'danger' ? 'text-red-500' : 'text-blue-500'
               )}>
                 {log.type === 'success' || log.type === 'info' ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
               </span>
               <span className="leading-tight">{log.msg}</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
