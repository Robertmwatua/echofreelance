/** Decorative indicator: pair with visible status text. */
export function LiveDot() {
  return <span className="relative inline-flex h-2 w-2 shrink-0" aria-hidden="true">
    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-600 dark:bg-emerald-400" />
  </span>
}
