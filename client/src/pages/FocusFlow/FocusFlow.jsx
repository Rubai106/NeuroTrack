import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { sessionApi } from '../../services/api'
import { Play, Pause, X, Volume2, VolumeX, AlertCircle, Check } from 'lucide-react'
import clsx from 'clsx'
import toast from 'react-hot-toast'

// ------------ Ambient sounds (Web Audio API, no external APIs) ------------
function createAmbientSound(ctx, type) {
  const gainNode = ctx.createGain()
  gainNode.gain.value = 0.15
  gainNode.connect(ctx.destination)

  if (type === 'rain') {
    // White noise filtered to sound like rain
    const bufferSize = ctx.sampleRate * 2
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1
    const source = ctx.createBufferSource()
    source.buffer = buffer
    source.loop = true
    const filter = ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.value = 400
    filter.Q.value = 0.5
    source.connect(filter)
    filter.connect(gainNode)
    source.start()
    return source
  }

  if (type === 'cafe') {
    // Low rumble + occasional high freq bursts simulating cafe ambiance
    const osc1 = ctx.createOscillator()
    osc1.type = 'sawtooth'
    osc1.frequency.value = 80
    const filter1 = ctx.createBiquadFilter()
    filter1.type = 'lowpass'
    filter1.frequency.value = 200
    osc1.connect(filter1)
    filter1.connect(gainNode)
    gainNode.gain.value = 0.04
    osc1.start()
    return osc1
  }

  if (type === 'forest') {
    // Pink noise for leaves / wind
    const bufferSize = ctx.sampleRate * 2
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    let b0=0, b1=0, b2=0, b3=0, b4=0, b5=0, b6=0
    for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1
        b0 = 0.99886*b0 + white*0.0555179; b1 = 0.99332*b1 + white*0.0750759
        b2 = 0.96900*b2 + white*0.1538520; b3 = 0.86650*b3 + white*0.3104856
        b4 = 0.55000*b4 + white*0.5329522; b5 = -0.7616*b5 - white*0.0168980
        data[i] = (b0+b1+b2+b3+b4+b5+b6 + white*0.5362) / 7
        b6 = white * 0.115926
    }
    const noiseSource = ctx.createBufferSource()
    noiseSource.buffer = buffer
    noiseSource.loop = true
    
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 800
    
    noiseSource.connect(filter)
    filter.connect(gainNode)
    noiseSource.start()

    // Bird sounds using oscillators
    const birdOsc = ctx.createOscillator()
    birdOsc.type = 'sine'
    const birdGain = ctx.createGain()
    birdGain.gain.value = 0
    birdOsc.connect(birdGain)
    birdGain.connect(gainNode)
    birdOsc.start()

    // Chirp loop
    const chirp = () => {
        const now = ctx.currentTime
        birdOsc.frequency.setValueAtTime(4000 + Math.random() * 2000, now)
        birdOsc.frequency.exponentialRampToValueAtTime(2000 + Math.random() * 1000, now + 0.1)
        birdGain.gain.setValueAtTime(0, now)
        birdGain.gain.linearRampToValueAtTime(0.05, now + 0.05)
        birdGain.gain.linearRampToValueAtTime(0, now + 0.1)
    }

    const intervalId = setInterval(() => {
        if (Math.random() > 0.5) chirp()
        if (Math.random() > 0.8) setTimeout(chirp, 150)
    }, 2000)

    gainNode.gain.value = 0.15

    return {
        stop: () => {
            try { noiseSource.stop() } catch(e){}
            try { birdOsc.stop() } catch(e){}
            clearInterval(intervalId)
        }
    }
  }

  // Default silence
  return null
}

const SOUNDS = [
  { id: 'none',   label: 'Silent',  icon: '🔇' },
  { id: 'rain',   label: 'Rain',    icon: '🌧' },
  { id: 'forest', label: 'Forest',  icon: '🌲' },
  { id: 'cafe',   label: 'Café',    icon: '☕' },
]

// ----------------------- Setup screen -------------------------
function SetupScreen({ onStart }) {
  const { user } = useAuth()
  const subjects = user?.subjects?.map(s => s.name) || []
  const [form, setForm] = useState({ subject: subjects[0] || '', topic: '', duration: 50, sound: 'none' })
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.type === 'number' ? +e.target.value : e.target.value }))

  return (
    <div className="min-h-screen bg-[#0f1117] flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <h1 className="text-xl font-semibold text-white mb-1">Focus Flow</h1>
        <p className="text-sm text-gray-400 mb-8">No distractions. Just you and the work.</p>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">Subject</label>
            <select className="w-full bg-white/10 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-sage-500 focus:ring-1 focus:ring-sage-500/50"
              value={form.subject} onChange={set('subject')}>
              {subjects.length === 0 && <option value="" className="bg-[#0f1117] text-white">Select subject</option>}
              {subjects.map(s => <option key={s} value={s} className="bg-[#0f1117] text-white">{s}</option>)}
              <option value="Other" className="bg-[#0f1117] text-white">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">Topic (optional)</label>
            <input className="w-full bg-white/10 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-sage-500"
              placeholder="e.g. Integration by parts"
              value={form.topic} onChange={set('topic')} />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">Duration</label>
            <div className="flex gap-2">
              {[25, 50, 90].map(d => (
                <button key={d} onClick={() => setForm(p => ({ ...p, duration: d }))}
                  className={clsx('flex-1 py-2 rounded-lg text-sm font-medium transition-all',
                    form.duration === d
                      ? 'bg-sage-600 text-white'
                      : 'bg-white/10 text-gray-300 hover:bg-white/15')}>
                  {d}m
                </button>
              ))}
              <input type="number" min="5" max="240"
                className="flex-1 bg-white/10 border border-white/10 rounded-lg px-2 py-2 text-sm text-white text-center focus:outline-none focus:border-sage-500"
                value={form.duration} onChange={set('duration')} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">Ambient sound</label>
            <div className="grid grid-cols-4 gap-2">
              {SOUNDS.map(s => (
                <button key={s.id} onClick={() => setForm(p => ({ ...p, sound: s.id }))}
                  className={clsx('flex flex-col items-center gap-1 py-2.5 rounded-lg text-xs transition-all',
                    form.sound === s.id
                      ? 'bg-sage-600/30 text-sage-300 border border-sage-600/50'
                      : 'bg-white/10 text-gray-400 hover:bg-white/15 border border-transparent')}>
                  <span className="text-lg">{s.icon}</span>
                  <span>{s.label}</span>
                </button>
              ))}
            </div>
          </div>

          <button onClick={() => onStart(form)}
            disabled={!form.subject}
            className="w-full bg-sage-600 hover:bg-sage-700 disabled:opacity-40 text-white font-medium py-3 rounded-xl transition-colors flex items-center justify-center gap-2 mt-2">
            <Play size={16} />
            Begin session
          </button>
        </div>
      </div>
    </div>
  )
}

// ----------------------- Active session -----------------------
function ActiveSession({ config, onEnd }) {
  const totalSecs = config.duration * 60
  const [secs, setSecs] = useState(totalSecs)
  const [running, setRunning] = useState(true)
  const [interruptions, setInterruptions] = useState(0)
  const [muted, setMuted] = useState(false)
  const [confirmExit, setConfirmExit] = useState(false)
  const intervalRef = useRef(null)
  const audioCtxRef = useRef(null)
  const soundRef = useRef(null)

  // Start ambient sound
  useEffect(() => {
    if (config.sound === 'none') return
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)()
      audioCtxRef.current = ctx
      soundRef.current = createAmbientSound(ctx, config.sound)
    } catch (e) { /* AudioContext not available */ }
    return () => {
      soundRef.current?.stop?.()
      audioCtxRef.current?.close?.()
    }
  }, [config.sound])

  // Mute/unmute
  useEffect(() => {
    if (!audioCtxRef.current) return
    if (muted) {
      audioCtxRef.current.suspend()
    } else {
      audioCtxRef.current.resume()
    }
  }, [muted])

  // Countdown
  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSecs(s => {
          if (s <= 1) { clearInterval(intervalRef.current); onEnd(totalSecs, interruptions); return 0 }
          return s - 1
        })
      }, 1000)
    } else {
      clearInterval(intervalRef.current)
    }
    return () => clearInterval(intervalRef.current)
  }, [running])

  const pause = () => {
    setRunning(false)
    setInterruptions(i => i + 1)
  }

  const resume = () => setRunning(true)

  const pct = ((totalSecs - secs) / totalSecs) * 100
  const mm = String(Math.floor(secs / 60)).padStart(2, '0')
  const ss = String(secs % 60).padStart(2, '0')
  const elapsed = totalSecs - secs

  // SVG ring
  const r = 110, circ = 2 * Math.PI * r
  const offset = circ - (pct / 100) * circ

  return (
    <div className="min-h-screen bg-[#0f1117] flex flex-col items-center justify-center p-6 relative">
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-sage-400 animate-pulse" />
          <span className="text-xs text-gray-400 font-medium">{config.subject}</span>
          {config.topic && <><span className="text-gray-600">·</span><span className="text-xs text-gray-500">{config.topic}</span></>}
        </div>
        <div className="flex items-center gap-2">
          {config.sound !== 'none' && (
            <button onClick={() => setMuted(!muted)}
              className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
              {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
            </button>
          )}
          <button onClick={() => setConfirmExit(true)}
            className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Timer ring */}
      <div className="relative">
        <svg width="260" height="260" viewBox="0 0 260 260">
          <circle cx="130" cy="130" r={r} fill="none" stroke="#1f2937" strokeWidth="12" />
          <circle cx="130" cy="130" r={r} fill="none"
            stroke={running ? '#4e844e' : '#374151'} strokeWidth="12" strokeLinecap="round"
            strokeDasharray={circ} strokeDashoffset={offset}
            transform="rotate(-90 130 130)"
            style={{ transition: running ? 'stroke-dashoffset 1s linear' : 'none' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-5xl font-mono font-semibold text-white tracking-tight">{mm}:{ss}</span>
          <span className="text-sm text-gray-500 mt-1">{running ? 'focusing' : 'paused'}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4 mt-8">
        {running ? (
          <button onClick={pause}
            className="w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all">
            <Pause size={22} />
          </button>
        ) : (
          <button onClick={resume}
            className="w-14 h-14 rounded-full bg-sage-600 hover:bg-sage-700 flex items-center justify-center text-white transition-all">
            <Play size={22} className="ml-1" />
          </button>
        )}
        <button onClick={() => onEnd(elapsed, interruptions)}
          className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-sm text-gray-300 transition-all">
          Finish early
        </button>
      </div>

      {/* Stats row */}
      <div className="flex gap-8 mt-10">
        <div className="text-center">
          <p className="text-xl font-semibold text-white">{Math.round(elapsed / 60)}</p>
          <p className="text-xs text-gray-500 mt-0.5">min elapsed</p>
        </div>
        <div className="text-center">
          <p className={clsx('text-xl font-semibold', interruptions > 3 ? 'text-amber-400' : 'text-white')}>{interruptions}</p>
          <p className="text-xs text-gray-500 mt-0.5">interruptions</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-semibold text-white">{Math.round(pct)}%</p>
          <p className="text-xs text-gray-500 mt-0.5">complete</p>
        </div>
      </div>

      {/* Confirm exit overlay */}
      {confirmExit && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
          <div className="bg-[#1a1f2e] rounded-2xl p-6 max-w-xs w-full mx-4 text-center">
            <p className="text-base font-semibold text-white mb-2">End session?</p>
            <p className="text-sm text-gray-400 mb-5">
              You've focused for {Math.round(elapsed / 60)} minutes. This will be saved.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmExit(false)}
                className="flex-1 py-2 rounded-xl bg-white/10 text-sm text-gray-300 hover:bg-white/15">
                Keep going
              </button>
              <button onClick={() => onEnd(elapsed, interruptions)}
                className="flex-1 py-2 rounded-xl bg-sage-600 text-sm text-white hover:bg-sage-700">
                End & save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ----------------------- Summary screen -----------------------
function SummaryScreen({ config, elapsed, interruptions, onDone }) {
  const focusScore = Math.max(1, Math.min(10, Math.round(10 - interruptions * 1.5)))
  const distractionLevel = interruptions === 0 ? 'None' : interruptions <= 2 ? 'Low' : interruptions <= 5 ? 'Medium' : 'High'
  const distractionColor = interruptions === 0 ? 'text-sage-400' : interruptions <= 2 ? 'text-blue-400' : interruptions <= 5 ? 'text-amber-400' : 'text-red-400'
  const pct = Math.round((elapsed / (config.duration * 60)) * 100)

  return (
    <div className="min-h-screen bg-[#0f1117] flex items-center justify-center p-6">
      <div className="w-full max-w-sm text-center">
        <div className="text-5xl mb-4">{pct >= 80 ? '🎯' : pct >= 50 ? '💪' : '📌'}</div>
        <h2 className="text-xl font-semibold text-white mb-1">Session complete</h2>
        <p className="text-sm text-gray-400 mb-8">{config.subject}{config.topic ? ` — ${config.topic}` : ''}</p>

        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Duration', value: `${Math.round(elapsed / 60)}m` },
            { label: 'Focus', value: `${focusScore}/10` },
            { label: 'Completion', value: `${pct}%` },
          ].map(s => (
            <div key={s.label} className="bg-white/5 rounded-xl py-3">
              <p className="text-lg font-semibold text-white">{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="bg-white/5 rounded-xl p-4 mb-6 text-left space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Distractions</span>
            <span className={clsx('font-medium', distractionColor)}>{distractionLevel} ({interruptions})</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Productive time</span>
            <span className="text-white font-medium">{Math.max(0, Math.round(elapsed / 60 * (1 - interruptions * 0.05)))}m</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">XP earned</span>
            <span className="text-sage-400 font-medium">+20 XP</span>
          </div>
        </div>

        <button onClick={onDone}
          className="w-full bg-sage-600 hover:bg-sage-700 text-white font-medium py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
          <Check size={16} /> Done
        </button>
      </div>
    </div>
  )
}

// ----------------------- Main page ---------------------------
export default function FocusFlow() {
  const navigate = useNavigate()
  const [phase, setPhase] = useState('setup') // setup | active | summary
  const [config, setConfig] = useState(null)
  const [result, setResult] = useState(null)

  const handleStart = (cfg) => {
    setConfig(cfg)
    setPhase('active')
  }

  const handleEnd = async (elapsed, interruptions) => {
    setResult({ elapsed, interruptions })
    setPhase('summary')

    // Save session if meaningful (>= 5 minutes)
    if (elapsed >= 300 && config) {
      const focusScore = Math.max(1, Math.min(10, Math.round(10 - interruptions * 1.5)))
      try {
        await sessionApi.create({
          subject: config.subject,
          topic: config.topic || 'General',
          durationMinutes: Math.round(elapsed / 60),
          focusQuality: focusScore,
          distractionMinutes: interruptions * 2,
          sessionType: 'deep-work',
          date: new Date(),
          completedAt: new Date(),
        })
        toast.success('Session saved!')
      } catch { /* silent fail */ }
    }
  }

  const handleDone = () => navigate('/')

  // Prevent back navigation during active session
  useEffect(() => {
    if (phase === 'active') {
      document.title = `Focusing… — NeuroTrack`
    } else {
      document.title = `NeuroTrack – Study Smarter`
    }
  }, [phase])

  if (phase === 'setup') return <SetupScreen onStart={handleStart} />
  if (phase === 'active') return <ActiveSession config={config} onEnd={handleEnd} />
  if (phase === 'summary') return <SummaryScreen config={config} elapsed={result.elapsed} interruptions={result.interruptions} onDone={handleDone} />
  return null
}
