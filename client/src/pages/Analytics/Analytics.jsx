import { useState, useEffect } from 'react'
import { analyticsApi } from '../../services/api'
import Spinner from '../../components/ui/Spinner'
import { format, subDays, eachDayOfInterval, startOfYear } from 'date-fns'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import clsx from 'clsx'

const PIE_COLORS = ['#4e844e', '#4A90E2', '#F59E0B', '#8B5CF6', '#EF4444', '#06B6D4']

function formatMins(mins) {
  const h = Math.floor(mins / 60), m = mins % 60
  return h ? `${h}h ${m}m` : `${m}m`
}

function Heatmap({ data }) {
  // Build a map of date → minutes
  const map = {}
  data.forEach(d => { map[d._id] = d.totalMinutes })

  const today = new Date()
  const yearAgo = subDays(today, 364)
  const days = eachDayOfInterval({ start: yearAgo, end: today })

  const maxMins = Math.max(...Object.values(map), 1)
  const getIntensity = (mins) => {
    if (!mins) return 0
    const pct = mins / maxMins
    if (pct < 0.25) return 1
    if (pct < 0.5) return 2
    if (pct < 0.75) return 3
    return 4
  }

  const intensityColors = [
    'bg-gray-100',
    'bg-sage-100',
    'bg-sage-200',
    'bg-sage-400',
    'bg-sage-600',
  ]

  // Group into weeks
  const weeks = []
  let week = []
  // Pad first week
  const firstDay = days[0].getDay()
  for (let i = 0; i < firstDay; i++) week.push(null)
  days.forEach(d => {
    const str = format(d, 'yyyy-MM-dd')
    week.push({ date: str, mins: map[str] || 0, intensity: getIntensity(map[str] || 0) })
    if (d.getDay() === 6) { weeks.push(week); week = [] }
  })
  if (week.length) weeks.push(week)

  return (
    <div>
      <div className="flex gap-0.5 overflow-x-auto pb-2">
        {weeks.map((w, wi) => (
          <div key={wi} className="flex flex-col gap-0.5">
            {Array.from({ length: 7 }, (_, di) => {
              const day = w[di]
              if (!day) return <div key={di} className="w-3 h-3" />
              return (
                <div key={di} title={`${day.date}: ${formatMins(day.mins)}`}
                  className={clsx('w-3 h-3 rounded-[2px] cursor-default', intensityColors[day.intensity])} />
              )
            })}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-1 mt-2 justify-end">
        <span className="text-[10px] text-gray-400 mr-1">Less</span>
        {intensityColors.map((c, i) => <div key={i} className={clsx('w-3 h-3 rounded-[2px]', c)} />)}
        <span className="text-[10px] text-gray-400 ml-1">More</span>
      </div>
    </div>
  )
}

export default function Analytics() {
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState(30)
  const [chartData, setChartData] = useState({ hours: [], subjects: [] })
  const [heatmap, setHeatmap] = useState([])
  const [bestTime, setBestTime] = useState([])
  const [burnout, setBurnout] = useState(null)
  const [dashStats, setDashStats] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const [charts, heat, best, burn, dash] = await Promise.all([
        analyticsApi.getCharts(days),
        analyticsApi.getHeatmap(),
        analyticsApi.getBestTime(),
        analyticsApi.getBurnout(),
        analyticsApi.getDashboard(),
      ])
      setChartData(charts.data.data)
      setHeatmap(heat.data.data)
      setBestTime(best.data.data)
      setBurnout(burn.data.data)
      setDashStats(dash.data.data)
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [days])

  // Fill missing days in hours chart
  const filledHours = Array.from({ length: days }, (_, i) => {
    const d = format(subDays(new Date(), days - 1 - i), 'yyyy-MM-dd')
    const found = (chartData.hours || []).find(x => x._id === d)
    return { date: format(subDays(new Date(), days - 1 - i), 'MMM d'), mins: found?.totalMinutes || 0, focus: found?.avgFocus || 0 }
  })

  const subjects = (chartData.subjects || []).map(s => ({ name: s._id, value: s.totalMinutes }))

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>

  return (
    <div className="px-6 py-6 max-w-5xl mx-auto fade-in">
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Analytics</h1>
          <p className="text-sm text-gray-500 mt-0.5">Your study patterns and insights</p>
        </div>
        <select className="input w-auto text-sm" value={days} onChange={e => setDays(+e.target.value)}>
          {[7, 14, 30, 90].map(d => <option key={d} value={d}>Last {d} days</option>)}
        </select>
      </div>

      {/* Burnout alert */}
      {burnout?.detected && (
        <div className="mb-5 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
          <span className="text-xl">⚠️</span>
          <div>
            <p className="text-sm font-medium text-amber-800">Burnout signal detected</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Your focus quality has been declining for {burnout.days} consecutive days. Consider taking a proper rest day.
            </p>
          </div>
        </div>
      )}

      {/* Summary stats */}
      {dashStats && (
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: 'Total this period', value: formatMins(dashStats.month?.mins || 0) },
            { label: 'Avg focus/session', value: `${(dashStats.week?.avgFocus || 0).toFixed(1)}/10` },
            { label: 'Sessions this month', value: dashStats.month?.sessions || 0 },
          ].map(s => (
            <div key={s.label} className="card p-4 text-center">
              <p className="text-xl font-semibold text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        {/* Hours chart */}
        <div className="card p-5 lg:col-span-2">
          <h2 className="section-title mb-4">Study hours</h2>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={filledHours} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="aGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4e844e" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#4e844e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false}
                interval={Math.floor(days / 7)} />
              <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
                formatter={v => [`${Math.round(v)}m`, 'Study time']} />
              <Area type="monotone" dataKey="mins" stroke="#4e844e" strokeWidth={2}
                fill="url(#aGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Subject distribution */}
        <div className="card p-5">
          <h2 className="section-title mb-4">Subject split</h2>
          {subjects.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-10">No data yet</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie data={subjects} cx="50%" cy="50%" innerRadius={40} outerRadius={65}
                    dataKey="value" paddingAngle={2}>
                    {subjects.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={v => formatMins(v)} contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {subjects.slice(0, 4).map((s, i) => (
                  <div key={s.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="text-gray-600 truncate max-w-[90px]">{s.name}</span>
                    </div>
                    <span className="text-gray-400">{formatMins(s.value)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Best study time */}
      {bestTime.length > 0 && (
        <div className="card p-5 mb-4">
          <h2 className="section-title mb-4">Best study times</h2>
          <div className="grid grid-cols-3 gap-3">
            {bestTime.slice(0, 3).map((t, i) => (
              <div key={i} className={clsx('rounded-xl p-4 text-center',
                i === 0 ? 'bg-sage-50 border border-sage-100' : 'bg-gray-50')}>
                <p className="text-xs text-gray-500 mb-1">#{i+1}</p>
                <p className="font-semibold text-gray-800">{t.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{String(t._id).padStart(2,'0')}:00</p>
                <p className="text-xs text-sage-600 mt-1">avg {(t.avgFocus || 0).toFixed(1)} focus</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Heatmap */}
      <div className="card p-5">
        <h2 className="section-title mb-4">Study activity — last 12 months</h2>
        <Heatmap data={heatmap} />
      </div>
    </div>
  )
}
