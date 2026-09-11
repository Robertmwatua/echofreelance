export function ProgressBar({ percent, className = '' }: { percent: number; className?: string }) {
  const p = Math.max(0, Math.min(100, percent))
  return (
    <div className={`h-2 w-full overflow-hidden rounded-full bg-mist/80 ${className}`}>
      <div
        className="h-full rounded-full bg-gradient-to-r from-moss to-fern transition-all duration-500"
        style={{ width: `${p}%` }}
      />
    </div>
  )
}
