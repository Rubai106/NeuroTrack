import { useEffect, useState } from 'react'
import { predictionApi } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import ProgressBar from '../../components/ui/ProgressBar'
import Spinner from '../../components/ui/Spinner'
import { TrendingUp, Calendar, AlertCircle, CheckCircle, Clock, Zap } from 'lucide-react'
import clsx from 'clsx'

function GradeRing({ score }) {
  const r = 52, circ = 2 * Math.PI * r
  const pct = score / 100
  const dashOffset = circ - pct * circ
  const color = score >= 75 ? '#4e844e' : score >= 55 ? '#F59E0B' : '#EF4444'

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="130" height="130" viewBox="0 0 130 130">
        <circle cx="65" cy="65" r={r} fill="none" stroke="#f3f4f6" strokeWidth="10" />
        <circle cx="65" cy="65" r={r} fill="none"
          stroke={color} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={dashOffset}
          transform="rotate(-90 65 65)"
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
      </svg>
      <div className="absolute text-center">
        <p className="text-3xl font-bold text-gray-900">{score}</p>
        <p className="text-xs text-gray-400">/ 100</p>
      </div>
    </div>
  )
}

const GRADE_CONFIG = {
  'A+': { label: 'Excellent', color: 'text-sage-600', bg: 'bg-sage-50' },
  'A':  { label: 'Very Good', color: 'text-sage-600', bg: 'bg-sage-50' },
  'B+': { label: 'Good',      color: 'text-blue-600', bg: 'bg-blue-50' },
  'B':  { label: 'Solid',     color: 'text-blue-600', bg: 'bg-blue-50' },
  'C':  { label: 'Average',   color: 'text-amber-600', bg: 'bg-amber-50' },
  'D':  { label: 'Needs Work',color: 'text-red-600',  bg: 'bg-red-50' },
}

export default function Predictions() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    predictionApi.get()
      .then(r => setData(r.data.data))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>

  if (!data || data.readinessScore === 0) {
    return (
      <div className="px-6 py-6 max-w-3xl mx-auto fade-in">
        <div className="page-header">
          <h1 className="text-xl font-semibold text-gray-900">Predictions</h1>
        </div>
        <div className="card p-10 text-center">
          <div className="text-4xl mb-4">📊</div>
          <h2 className="text-base font-semibold text-gray-700 mb-2">Not enough data yet</h2>
          <p className="text-sm text-gray-500 max-w-xs mx-auto">
            Log at least a few study sessions and quiz results to get your exam readiness prediction.
          </p>
        </div>
      </div>
    )
  }

  const grade = GRADE_CONFIG[data.expectedGrade] || GRADE_CONFIG['C']
  const breakdown = data.breakdown || {}

  return (
    <div className="px-6 py-6 max-w-4xl mx-auto fade-in">
      <div className="page-header flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Predictions</h1>
          <p className="text-sm text-gray-500 mt-0.5">Formula-based exam readiness analysis</p>
        </div>
        {data.daysUntilExam !== null && (
          <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-100 px-3 py-1.5 rounded-lg">
            <Calendar size={13} className="text-amber-600" />
            <span className="text-xs font-medium text-amber-700">
              {data.daysUntilExam > 0
                ? `${data.daysUntilExam} days until exam`
                : data.daysUntilExam === 0 ? 'Exam today!'
                : `Exam was ${Math.abs(data.daysUntilExam)} days ago`}
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
        {/* Readiness score */}
        <div className="card p-6 flex flex-col items-center text-center">
          <p className="text-sm font-medium text-gray-500 mb-4">Exam Readiness</p>
          <GradeRing score={data.readinessScore} />
          <div className={clsx('mt-4 px-4 py-2 rounded-xl', grade.bg)}>
            <p className={clsx('text-2xl font-bold', grade.color)}>{data.expectedGrade}</p>
            <p className={clsx('text-xs', grade.color)}>{grade.label}</p>
          </div>
          <p className="text-xs text-gray-400 mt-3">
            Based on {data.totalStudyHours}h of study in the last 30 days
          </p>
        </div>

        {/* Score breakdown */}
        <div className="card p-6">
          <p className="text-sm font-medium text-gray-700 mb-4">Score Breakdown</p>
          <div className="space-y-4">
            {[
              { label: 'Consistency', key: 'consistency', icon: <Zap size={13} />, desc: 'Streak + session frequency' },
              { label: 'Study Hours', key: 'studyHours', icon: <Clock size={13} />, desc: 'Total time invested' },
              { label: 'Weakness Coverage', key: 'weaknessCoverage', icon: <CheckCircle size={13} />, desc: 'Unresolved weak topics' },
              { label: 'Focus Quality', key: 'focusQuality', icon: <TrendingUp size={13} />, desc: 'Average focus score' },
            ].map(item => {
              const val = breakdown[item.key] || 0
              const color = val >= 70 ? 'sage' : val >= 45 ? 'blue' : 'amber'
              return (
                <div key={item.key}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5 text-xs text-gray-600">
                      <span className="text-gray-400">{item.icon}</span>
                      <span className="font-medium">{item.label}</span>
                      <span className="text-gray-400">·</span>
                      <span className="text-gray-400">{item.desc}</span>
                    </div>
                    <span className="text-xs font-semibold text-gray-700">{val}%</span>
                  </div>
                  <ProgressBar value={val} max={100} color={color} size="sm" />
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Weights explanation */}
      <div className="card p-4 mb-4 bg-gray-50 border-0">
        <p className="text-xs text-gray-500">
          <strong className="text-gray-700">Formula:</strong>{' '}
          Consistency (30%) + Study Hours (25%) + Weakness Coverage (25%) + Focus Quality (20%)
        </p>
      </div>

      {/* Suggestions */}
      {data.suggestions?.length > 0 && (
        <div className="card p-5">
          <h2 className="section-title mb-4 flex items-center gap-2">
            <AlertCircle size={16} className="text-amber-500" />
            What to improve
          </h2>
          <div className="space-y-2.5">
            {data.suggestions.map((s, i) => (
              <div key={i} className="flex items-start gap-2.5 p-3 bg-amber-50 rounded-lg border border-amber-100">
                <span className="text-amber-500 shrink-0 mt-0.5">→</span>
                <p className="text-sm text-amber-800">{s}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
