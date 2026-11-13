export function Sparkle({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={`ef-spark ${className}`} width="14" height="14"
      fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3.5 13.7 9l5.5 1.7-5.5 1.7L12 18l-1.7-5.6L4.8 10.7 10.3 9z" />
      <path d="M18.5 4.2v2.6M19.8 5.5h-2.6M5.4 16.6v1.9M6.4 17.5H4.5" />
    </svg>
  )
}
