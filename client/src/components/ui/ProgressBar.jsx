import clsx from 'clsx'

export default function ProgressBar({ value = 0, max = 100, color = 'sage', size = 'md', showLabel = false }) {
  const pct = Math.min(100, Math.round((value / max) * 100))
  const colors = {
    sage: 'bg-sage-500',
    blue: 'bg-blue-500',
    amber: 'bg-amber-500',
    red: 'bg-red-500',
    purple: 'bg-purple-500',
  }
  const heights = { sm: 'h-1.5', md: 'h-2', lg: 'h-3' }

  return (
    <div className="flex items-center gap-2">
      <div className={clsx('flex-1 bg-gray-100 rounded-full overflow-hidden', heights[size])}>
        <div
          className={clsx('h-full rounded-full transition-all duration-500', colors[color])}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && <span className="text-xs text-gray-500 w-8 text-right">{pct}%</span>}
    </div>
  )
}
