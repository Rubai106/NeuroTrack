import { useState, useEffect, useRef } from 'react'
import { Play, Pause, RotateCcw, SkipForward } from 'lucide-react'
import clsx from 'clsx'

const MODES = {
  work: { label: 'Focus', color: 'text-sage-600', bg: 'bg-sage-50', border: 'border-sage-200' },
  break: { label: 'Break', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
  longBreak: { label: 'Long break', color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
}

export default function PomodoroTimer({ workMins = 25, breakMins = 5, onPomodoroComplete }) {
  const [mode, setMode] = useState('work')
  const [seconds, setSeconds] = useState(workMins * 60)
  const [running, setRunning] = useState(false)
  const [completed, setCompleted] = useState(0)
  const intervalRef = useRef(null)

  const totalSecs = mode === 'work' ? workMins * 60 : mode === 'break' ? breakMins * 60 : 15 * 60
  const pct = ((totalSecs - seconds) / totalSecs) * 100

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSeconds(s => {
          if (s <= 1) {
            clearInterval(intervalRef.current)
            setRunning(false)
            handleTimerEnd()
            return 0
          }
          return s - 1
        })
      }, 1000)
    } else {
      clearInterval(intervalRef.current)
    }
    return () => clearInterval(intervalRef.current)
  }, [running, mode])

  const handleTimerEnd = () => {
    if (mode === 'work') {
      const newCount = completed + 1
      setCompleted(newCount)
      onPomodoroComplete?.(newCount)
      if (newCount % 4 === 0) { setMode('longBreak'); setSeconds(15 * 60) }
      else { setMode('break'); setSeconds(breakMins * 60) }
    } else {
      setMode('work'); setSeconds(workMins * 60)
    }
  }

  const reset = () => {
    setRunning(false)
    setSeconds(mode === 'work' ? workMins * 60 : breakMins * 60)
  }

  const skip = () => {
    setRunning(false)
    handleTimerEnd()
  }

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0')
  const ss = String(seconds % 60).padStart(2, '0')
  const m = MODES[mode]

  // SVG circle
  const r = 54, circ = 2 * Math.PI * r
  const dashOffset = circ - (pct / 100) * circ

  return (
    <div className={clsx('card p-6 text-center border', m.border)}>
      {/* Mode tabs */}
      <div className="flex gap-1 justify-center mb-5">
        {Object.entries(MODES).map(([key, val]) => (
          <button key={key}
            onClick={() => { setMode(key); setRunning(false); setSeconds(key === 'work' ? workMins * 60 : key === 'break' ? breakMins * 60 : 15 * 60) }}
            className={clsx('px-3 py-1 rounded-lg text-xs font-medium transition-all',
              mode === key ? `${val.bg} ${val.color}` : 'text-gray-400 hover:bg-gray-50'
            )}>
            {val.label}
          </button>
        ))}
      </div>

      {/* Timer circle */}
      <div className="relative inline-flex items-center justify-center mb-5">
        <svg width="130" height="130" viewBox="0 0 130 130">
          <circle cx="65" cy="65" r={r} fill="none" stroke="#f3f4f6" strokeWidth="8" />
          <circle cx="65" cy="65" r={r} fill="none"
            stroke={mode === 'work' ? '#4e844e' : mode === 'break' ? '#3b82f6' : '#8b5cf6'}
            strokeWidth="8" strokeLinecap="round"
            strokeDasharray={circ} strokeDashoffset={dashOffset}
            transform="rotate(-90 65 65)"
            style={{ transition: 'stroke-dashoffset 1s linear' }}
          />
        </svg>
        <div className="absolute text-center">
          <span className={clsx('text-3xl font-semibold font-mono tracking-tight', m.color)}>
            {mm}:{ss}
          </span>
          <p className="text-xs text-gray-400 mt-0.5">{m.label}</p>
        </div>
      </div>

      {/* Pomodoro dots */}
      <div className="flex justify-center gap-1.5 mb-4">
        {[0,1,2,3].map(i => (
          <div key={i} className={clsx('w-2 h-2 rounded-full',
            i < (completed % 4) ? 'bg-sage-500' : 'bg-gray-200')} />
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-2">
        <button onClick={reset}
          className="w-9 h-9 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors">
          <RotateCcw size={14} />
        </button>
        <button onClick={() => setRunning(!running)}
          className={clsx('w-12 h-12 rounded-xl flex items-center justify-center text-white transition-all',
            mode === 'work' ? 'bg-sage-600 hover:bg-sage-700' : mode === 'break' ? 'bg-blue-500 hover:bg-blue-600' : 'bg-purple-500 hover:bg-purple-600'
          )}>
          {running ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
        </button>
        <button onClick={skip}
          className="w-9 h-9 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors">
          <SkipForward size={14} />
        </button>
      </div>

      <p className="text-xs text-gray-400 mt-3">{completed} pomodoro{completed !== 1 ? 's' : ''} completed</p>
    </div>
  )
}
