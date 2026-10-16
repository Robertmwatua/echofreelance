export function ProgressBar({ percent, className = '' }: { percent: number; className?: string }) {
  const p = Number.isFinite(percent) ? Math.max(0, Math.min(100, percent)) : 0
  return (
    <div role="progressbar" aria-label="Course progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={p} className={`h-2 w-full overflow-hidden rounded-full bg-mist/80 ${className}`}>
      <div
        className="h-full rounded-full bg-moss transition-all duration-500"
        style={{ width: `${p}%` }}
      />
    </div>
  )
}
