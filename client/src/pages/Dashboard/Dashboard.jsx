import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { analyticsApi, goalApi, engineApi } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import ProgressBar from '../../components/ui/ProgressBar'
import DailyBrief from '../../components/ui/DailyBrief'
import SystemFeed from '../../components/ui/SystemFeed'
import ReviewQueue from '../../components/ui/ReviewQueue'
import CognitiveLoadMeter from '../../components/ui/CognitiveLoadMeter'
import ReadinessDisplay from '../../components/ui/ReadinessDisplay'
import Spinner from '../../components/ui/Spinner'
import { Clock, Flame, Target, Plus, ArrowRight, Zap } from 'lucide-react'
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { format, subDays } from 'date-fns'

function StatCard({ icon, label, value, sub, color = 'gray' }) {
  const colors = {
    sage:  'bg-sage-50 text-sage-600',
    amber: 'bg-amber-50 text-amber-600',
    blue:  'bg-blue-50 text-blue-500',
    gray:  'bg-gray-100 text-gray-500',
  }
  return (
    <div className="stat-card fade-in">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${colors[color]} mb-3`}>
        {icon}
      </div>
      <p className="text-2xl font-semibold text-gray-900 tracking-tight">{value}</p>
      <p className="text-xs font-medium text-gray-500 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  )
}

function fmt(mins) {
  if (!mins) return '0m'
  const h = Math.floor(mins / 60), m = mins % 60
  return h ? `${h}h ${m}m` : `${m}m`
}

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [chartData, setChartData] = useState([])
  const [goals, setGoals] = useState([])
  const [behaviorProfile, setBehaviorProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      analyticsApi.getDashboard(),
      analyticsApi.getCharts(14),
      goalApi.getAll({ status: 'active' }),
      engineApi.getBehaviorProfile(),
    ]).then(([dash, charts, goalRes, profileRes]) => {
      setStats(dash.data.data)
      const map = {}
      ;(charts.data.data.hours || []).forEach(d => { map[d._id] = d.totalMinutes })
      setChartData(Array.from({ length: 14 }, (_, i) => {
        const d = subDays(new Date(), 13 - i)
        return { date: format(d, 'MMM d'), mins: map[format(d, 'yyyy-MM-dd')] || 0 }
      }))
      setGoals((goalRes.data.data || []).slice(0, 3))
      setBehaviorProfile(profileRes.data?.data || null)
    }).finally(() => setLoading(false))
  }, [])

  if (loading && !stats) return (
    <div className="flex flex-col items-center justify-center h-64 space-y-4">
      <Spinner size="lg" />
      <p className="text-xs text-gray-400 animate-pulse">Syncing your study data...</p>
    </div>
  )

  const today = stats?.today || {}
  const week  = stats?.week  || {}
  const dailyGoal = user?.preferences?.dailyGoalMinutes || 120
  const recentSessions = stats?.recentSessions || []

  return (
    <div className="px-6 py-6 max-w-5xl mx-auto fade-in">
      {/* Header */}
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            {user?.name?.split(' ')[0]}'s Dashboard
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/focus" className="btn-secondary flex items-center gap-1.5">
            <Zap size={14} /> Focus
          </Link>
          <Link to="/sessions" className="btn-primary flex items-center gap-1.5">
            <Plus size={14} /> Log session
          </Link>
        </div>
      </div>

      {/* Cognitive Load Meter */}
      <CognitiveLoadMeter initialProfile={behaviorProfile} />

      {/* Daily Brief */}
      <DailyBrief />

      {/* Today's progress */}
      <div className="card p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Today's goal</span>
          <span className="text-sm text-gray-500">
            <span className="font-semibold text-gray-900">{fmt(today.mins)}</span> / {fmt(dailyGoal)}
          </span>
        </div>
        <ProgressBar value={today.mins || 0} max={dailyGoal} color="sage" size="lg" />
        <p className="text-xs text-gray-400 mt-1.5">
          {today.sessions || 0} session{today.sessions !== 1 ? 's' : ''}
          {today.mins >= dailyGoal
            ? ' · Goal reached! 🎉'
            : ` · ${fmt(Math.max(0, dailyGoal - (today.mins || 0)))} to go`}
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <StatCard icon={<Clock size={18} />}  label="Today"     value={fmt(today.mins)} sub={`Focus ${(today.avgFocus||0).toFixed(1)}/10`} color="sage" />
        <StatCard icon={<Flame size={18} />}  label="Streak"    value={`${user?.currentStreak||0}d`} sub={`Best ${user?.longestStreak||0}d`} color="amber" />
        <StatCard icon={<Target size={18} />} label="This week" value={fmt(week.mins)}  sub={`${week.sessions||0} sessions`} color="blue" />
        <StatCard icon={<Zap size={18} />}    label="Level"     value={`Lvl ${user?.level||1}`} sub={`${(user?.xp||0).toLocaleString()} XP`} color="gray" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        {/* Trend chart */}
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">Study trend</h2>
            <span className="text-xs text-gray-400">14 days</span>
          </div>
          <ResponsiveContainer width="100%" height={130}>
            <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#4e844e" stopOpacity={0.12} />
                  <stop offset="95%" stopColor="#4e844e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb', boxShadow: 'none' }}
                formatter={v => [`${Math.round(v)}m`, 'Study time']}
                labelStyle={{ color: '#374151', fontWeight: 500 }}
              />
              <Area type="monotone" dataKey="mins" stroke="#4e844e" strokeWidth={2}
                fill="url(#grad)" dot={false} activeDot={{ r: 4, fill: '#4e844e' }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Active goals */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">Goals</h2>
            <Link to="/goals" className="text-xs text-sage-600 hover:underline flex items-center gap-0.5">
              All <ArrowRight size={11} />
            </Link>
          </div>
          {goals.length === 0 ? (
            <div className="text-center py-5">
              <p className="text-xs text-gray-400 mb-2">No active goals</p>
              <Link to="/goals" className="text-xs text-sage-600">Set a goal →</Link>
            </div>
          ) : (
            <div className="space-y-4">
              {goals.map(g => (
                <div key={g._id}>
                  <div className="flex justify-between mb-1.5">
                    <p className="text-xs font-medium text-gray-700 truncate pr-2">{g.title}</p>
                    <span className="text-xs text-gray-400 shrink-0">{g.progressPercent || 0}%</span>
                  </div>
                  <ProgressBar value={g.currentMinutes || 0} max={g.targetMinutes}
                    color={g.progressPercent >= 100 ? 'sage' : 'blue'} size="sm" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <ReadinessDisplay />
        <SystemFeed initialProfile={behaviorProfile} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <ReviewQueue />

        {/* Recent sessions */}
        {recentSessions.length > 0 && (
          <div className="card">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
              <h2 className="section-title">Recent sessions</h2>
              <Link to="/sessions" className="text-xs text-sage-600 hover:underline flex items-center gap-0.5">
                All <ArrowRight size={11} />
              </Link>
            </div>
            <div className="divide-y divide-gray-50">
              {recentSessions.slice(0, 4).map(s => (
                <div key={s._id} className="flex items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-sage-50 flex items-center justify-center text-sage-600 shrink-0">
                      <Clock size={13} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{s.subject}</p>
                      <p className="text-xs text-gray-400">{s.topic}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-700">{fmt(s.durationMinutes)}</p>
                    <p className="text-xs text-gray-400">Focus {s.focusQuality}/10</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
