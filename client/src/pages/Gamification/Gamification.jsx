import { useEffect, useState } from 'react'
import { gamificationApi } from '../../services/api'
import Spinner from '../../components/ui/Spinner'
import ProgressBar from '../../components/ui/ProgressBar'
import { Trophy, Flame, Clock, Zap } from 'lucide-react'
import clsx from 'clsx'

const LEVEL_NAMES = ['', 'Beginner', 'Learner', 'Student', 'Scholar', 'Academic',
  'Expert', 'Master', 'Champion', 'Legend', 'NeuroMaster']

export default function Gamification() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    gamificationApi.get()
      .then(r => setData(r.data.data))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>
  if (!data) return null

  const earnedIds = data.badges.map(b => b.id)
  const xpInLevel = data.xp - (data.xpForCurrent || 0)
  const xpNeeded = (data.xpForNext || 100) - (data.xpForCurrent || 0)

  return (
    <div className="px-6 py-6 max-w-4xl mx-auto fade-in">
      <div className="page-header">
        <h1 className="text-xl font-semibold text-gray-900">Achievements</h1>
        <p className="text-sm text-gray-500 mt-0.5">Your progress and earned rewards</p>
      </div>

      {/* XP Card */}
      <div className="card p-6 mb-5 bg-gradient-to-br from-sage-600 to-sage-700 text-white border-0">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-sage-200 text-sm mb-1">Current level</p>
            <h2 className="text-3xl font-bold">Level {data.level}</h2>
            <p className="text-sage-200 text-sm mt-0.5">{LEVEL_NAMES[data.level] || 'Elite'}</p>
          </div>
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center">
            <Trophy size={28} className="text-white" />
          </div>
        </div>
        <div className="flex justify-between items-center mb-2 text-sm">
          <span className="text-sage-200">{data.xp.toLocaleString()} XP total</span>
          <span className="text-sage-200">{xpNeeded - xpInLevel} XP to next level</span>
        </div>
        <div className="h-2 bg-white/20 rounded-full overflow-hidden">
          <div className="h-full bg-white rounded-full transition-all duration-700"
            style={{ width: `${Math.min(100, Math.round((xpInLevel / xpNeeded) * 100))}%` }} />
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { icon: <Flame size={18} />, label: 'Current streak', value: `${data.currentStreak}d`, color: 'text-amber-600 bg-amber-50' },
          { icon: <Zap size={18} />, label: 'Best streak', value: `${data.longestStreak}d`, color: 'text-purple-600 bg-purple-50' },
          { icon: <Clock size={18} />, label: 'Total hours', value: `${data.totalHours}h`, color: 'text-blue-600 bg-blue-50' },
          { icon: <Trophy size={18} />, label: 'Sessions', value: data.totalSessions, color: 'text-sage-600 bg-sage-50' },
        ].map(s => (
          <div key={s.label} className="card p-4 text-center">
            <div className={clsx('w-9 h-9 rounded-xl flex items-center justify-center mx-auto mb-2', s.color)}>
              {s.icon}
            </div>
            <p className="text-xl font-semibold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Badges */}
      <div className="card p-5">
        <h2 className="section-title mb-4">Badges</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {data.allBadges.map(badge => {
            const earned = earnedIds.includes(badge.id)
            const earnedData = data.badges.find(b => b.id === badge.id)
            return (
              <div key={badge.id} className={clsx('rounded-xl p-4 text-center border transition-all',
                earned
                  ? 'bg-white border-sage-200 shadow-sm'
                  : 'bg-gray-50 border-gray-100 opacity-50 grayscale')}>
                <div className="text-3xl mb-2">{badge.icon}</div>
                <p className={clsx('text-xs font-semibold mb-0.5', earned ? 'text-gray-800' : 'text-gray-500')}>
                  {badge.name}
                </p>
                <p className="text-[10px] text-gray-400 leading-tight">{badge.description}</p>
                {earned && earnedData?.earnedAt && (
                  <p className="text-[10px] text-sage-600 mt-1.5 font-medium">
                    ✓ Earned
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* XP Guide */}
      <div className="card p-5 mt-4">
        <h2 className="section-title mb-4">How to earn XP</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { action: 'Complete a session', xp: 20, icon: '📚' },
            { action: 'Finish a Pomodoro', xp: 10, icon: '🍅' },
            { action: 'Complete a goal', xp: 50, icon: '✅' },
            { action: 'Daily streak', xp: 15, icon: '🔥' },
            { action: 'Take a quiz', xp: 25, icon: '📝' },
            { action: 'Add a note', xp: 5, icon: '💡' },
          ].map(e => (
            <div key={e.action} className="flex items-center gap-2.5 p-3 bg-gray-50 rounded-xl">
              <span className="text-xl">{e.icon}</span>
              <div>
                <p className="text-xs font-medium text-gray-700">{e.action}</p>
                <p className="text-xs text-sage-600 font-semibold">+{e.xp} XP</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
