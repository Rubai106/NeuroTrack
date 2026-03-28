import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip, Legend } from 'recharts'

export default function ConfidenceGraph({ weaknesses }) {
  if (!weaknesses || weaknesses.length === 0) return null

  // Build radar data: confidence vs inverse weakness score
  const data = weaknesses.slice(0, 7).map(w => {
    const errorRate = w.totalAttempts > 0 ? w.wrongAttempts / w.totalAttempts : 0.5
    const studyPenalty = Math.max(0, 1 - (w.studyWeightHours || 0) / 10)
    const weakness = Math.round(Math.min(100, errorRate * 60 + studyPenalty * 40))
    const mastery = 100 - weakness
    const confidence = w.confidenceScore || 50

    // Detect mismatch
    const gap = confidence - mastery
    const isOverconfident = gap > 25
    const isUnderconfident = gap < -25

    return {
      topic: w.topic.length > 12 ? w.topic.slice(0, 12) + '…' : w.topic,
      confidence,
      mastery,
      isOverconfident,
      isUnderconfident,
    }
  })

  const overconfident = data.filter(d => d.isOverconfident)
  const underconfident = data.filter(d => d.isUnderconfident)

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="section-title">Confidence vs Mastery</h2>
        <div className="flex gap-3 text-xs">
          {overconfident.length > 0 && (
            <span className="text-red-500 font-medium">⚠ {overconfident.length} overconfident</span>
          )}
          {underconfident.length > 0 && (
            <span className="text-blue-500 font-medium">💡 {underconfident.length} underestimated</span>
          )}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <RadarChart data={data} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
          <PolarGrid stroke="#e5e7eb" />
          <PolarAngleAxis dataKey="topic" tick={{ fontSize: 11, fill: '#6b7280' }} />
          <Radar name="Confidence (self)" dataKey="confidence" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} strokeWidth={1.5} dot={{ r: 3, fill: '#3b82f6' }} />
          <Radar name="Mastery (quiz-based)" dataKey="mastery" stroke="#4e844e" fill="#4e844e" fillOpacity={0.15} strokeWidth={1.5} dot={{ r: 3, fill: '#4e844e' }} />
          <Tooltip
            contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
            formatter={(v, n) => [`${v}%`, n]}
          />
          <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
        </RadarChart>
      </ResponsiveContainer>

      {/* Mismatch callouts */}
      {(overconfident.length > 0 || underconfident.length > 0) && (
        <div className="grid grid-cols-2 gap-2 mt-3">
          {overconfident.slice(0, 2).map(d => (
            <div key={d.topic} className="p-2.5 bg-red-50 border border-red-100 rounded-lg">
              <p className="text-xs font-medium text-red-700">Overconfident</p>
              <p className="text-xs text-red-600">{d.topic} — rate yourself {d.confidence}% but quiz shows {d.mastery}%</p>
            </div>
          ))}
          {underconfident.slice(0, 2).map(d => (
            <div key={d.topic} className="p-2.5 bg-blue-50 border border-blue-100 rounded-lg">
              <p className="text-xs font-medium text-blue-700">Underestimated</p>
              <p className="text-xs text-blue-600">{d.topic} — you're actually at {d.mastery}%, trust your data</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
