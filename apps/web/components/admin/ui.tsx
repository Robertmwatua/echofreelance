import { ReactNode, useEffect, useId, useRef, useState } from 'react'
import { fullWhen } from '../../lib/adminFormat'

/** Dot + text, no border. Tone carries meaning, but the text always says it too. */
export type BadgeTone = 'neutral' | 'positive' | 'caution' | 'alert' | 'info'
export function StatusBadge({ children, tone = 'neutral' }: { children: ReactNode; tone?: BadgeTone }) {
  return <span className={`adm-badge adm-badge-${tone}`}><span className="adm-badge-dot" aria-hidden="true" />{children}</span>
}

/** Label over value. Zero reads muted; `alert` pulls the value to the accent. */
export function StatBlock({ label, value, alert = false }: { label: string; value: ReactNode; alert?: boolean }) {
  const zero = typeof value === 'string' && /^KES 0$|^0$/.test(value)
  return <div className="adm-stat">
    <span className="adm-stat-label">{label}</span>
    <span className={`adm-stat-value ${zero ? 'is-zero' : ''} ${alert && !zero ? 'is-alert' : ''}`}>{value}</span>
  </div>
}

/** Last 6 characters, the whole thing on hover and in the clipboard. */
export function CopyableId({ value, label = 'reference' }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>()
  useEffect(() => () => clearTimeout(timer.current), [])
  async function copy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      clearTimeout(timer.current)
      timer.current = setTimeout(() => setCopied(false), 2000)
    } catch { /* clipboard blocked; the full value is still in the title */ }
  }
  return <span className="adm-id">
    <code title={value}>…{value.slice(-6)}</code>
    <button type="button" onClick={copy} aria-label={`Copy full ${label}`}>
      {copied
        ? <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 13 4 4 10-10" /></svg>
        : <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="9" width="12" height="12" rx="1" /><path d="M5 15V4a1 1 0 0 1 1-1h9" /></svg>}
    </button>
    {copied && <span role="status" className="sr-only">Copied</span>}
  </span>
}

/** A timestamp that shows its age and keeps the exact moment in the tooltip. */
export function Stamp({ iso, children }: { iso: string; children: ReactNode }) {
  return <time dateTime={iso} title={fullWhen(iso)}>{children}</time>
}

/** All · Pending · Overdue, each with its count. One row, scrolls on small screens. */
export function SegmentedFilter({ label, value, options, onChange }: {
  label: string
  value: string
  options: Array<{ value: string; label: string; count?: number }>
  onChange: (v: string) => void
}) {
  return <div className="adm-segmented" role="group" aria-label={label}>
    {options.map(o => <button key={o.value} type="button" aria-pressed={value === o.value} onClick={() => onChange(o.value)}>
      {o.label}{typeof o.count === 'number' && <span className="adm-segmented-count">{o.count}</span>}
    </button>)}
  </div>
}

/** Refresh control plus the time the data was last read. */
export function RefreshButton({ busy, onClick, updatedAt }: { busy: boolean; onClick: () => void; updatedAt?: string }) {
  return <div className="adm-refresh">
    <button type="button" onClick={onClick} disabled={busy} aria-label="Refresh" className="adm-icon-button">
      <svg viewBox="0 0 24 24" aria-hidden="true" className={busy ? 'is-spinning' : ''}>
        <path d="M20 12a8 8 0 1 1-2.3-5.6" /><path d="M20 4v5h-5" />
      </svg>
    </button>
    {updatedAt && <span className="adm-refresh-caption">Updated {updatedAt}</span>}
  </div>
}

/** One record. The whole header is the toggle, so Enter and Space both work. */
export function DataRow({ summary, children, defaultOpen = false }: { summary: ReactNode; children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  const id = useId()
  return <li className={`adm-row ${open ? 'is-open' : ''}`}>
    <button type="button" className="adm-row-head" aria-expanded={open} aria-controls={id} onClick={() => setOpen(o => !o)}>
      {summary}
      <svg className="adm-row-chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="m8 10 4 4 4-4" /></svg>
    </button>
    <div id={id} className="adm-row-body" hidden={!open}>{children}</div>
  </li>
}

/** Short by design: never taller than the content it stands in for. */
export function EmptyState({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return <div className="adm-empty">
    <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M8.5 13.5h7" /></svg>
    <div><p className="adm-empty-title">{title}</p>{children && <p className="adm-empty-note">{children}</p>}</div>
    {action}
  </div>
}

/** Rows at the real dimensions, so nothing jumps when the data lands. */
export function RowSkeleton({ count = 3 }: { count?: number }) {
  return <ul className="adm-rows" role="status" aria-label="Loading records" aria-busy="true">
    {Array.from({ length: count }, (_, i) => <li key={i} className="adm-row" aria-hidden="true">
      <div className="adm-row-head">
        <div className="adm-skel-stack"><span className="ef-skeleton adm-skel adm-skel-name" /><span className="ef-skeleton adm-skel adm-skel-sub" /></div>
        <span className="ef-skeleton adm-skel adm-skel-pill" />
      </div>
    </li>)}
  </ul>
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return <div className="adm-error" role="alert">
    <div><p className="adm-empty-title">Could not load this list.</p><p className="adm-empty-note">{message}</p></div>
    <button type="button" className="adm-button-secondary" onClick={onRetry}>Retry</button>
  </div>
}
