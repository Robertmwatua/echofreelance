import Link from 'next/link'
import { ReactNode } from 'react'

export function PageHero({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children?: ReactNode }) {
  return <header className="ef-hero">
    <p className="ef-eyebrow">{eyebrow}</p>
    <h1 className="ef-title mt-4">{title}</h1>
    <p className="ef-muted mt-4 max-w-2xl text-base leading-7">{description}</p>
    {children && <div className="mt-6 flex flex-wrap gap-2">{children}</div>}
  </header>
}

export function FeedbackCard({ title, description, retry, action, error = false }: { title: string; description: string; retry?: () => void; action?: { href: string; label: string }; error?: boolean }) {
  return <section className="ef-feedback" role={error ? 'alert' : 'status'}>
    <div className={`ef-feedback-icon ${error ? 'text-amber-800 dark:text-amber-200' : 'text-fern'}`}>
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        {error ? <><path d="M12 3 2 20h20L12 3Z" strokeLinejoin="round" /><path d="M12 9v5m0 3v.1" strokeLinecap="round" /></> : <><rect x="4" y="5" width="16" height="16" rx="2" /><path d="M8 3v4m8-4v4M4 11h16m-10 5h4" strokeLinecap="round" /></>}
      </svg>
    </div>
    <div className="min-w-0 flex-1"><p className="ef-eyebrow">{error ? 'Connection interrupted' : 'A little room for what’s next'}</p><h2 className="mt-2 font-display text-2xl">{title}</h2><p className="ef-muted mt-3 max-w-xl text-sm leading-6">{description}</p>
      <div className="mt-5 flex flex-wrap gap-3">{retry && <button onClick={retry} className="ef-btn"><span aria-hidden="true">↻</span> Try again</button>}{action && <Link href={action.href} className="ef-btn-ghost">{action.label} <span aria-hidden="true">→</span></Link>}</div>
    </div>
  </section>
}

export function CardSkeletons({ label = 'Loading content', count = 3 }: { label?: string; count?: number }) {
  return <div role="status" aria-live="polite" className="mt-8"><span className="sr-only">{label}</span><div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" aria-hidden="true">{Array.from({ length: count }, (_, i) => <div key={i} className="ef-panel space-y-6"><div className="ef-skeleton h-6 w-24" /><div className="space-y-3"><div className="ef-skeleton h-7 w-4/5" /><div className="ef-skeleton h-4 w-full" /><div className="ef-skeleton h-4 w-2/3" /></div><div className="flex items-center gap-3"><div className="ef-skeleton h-10 w-10 !rounded-full" /><div className="ef-skeleton h-4 w-28" /></div><div className="flex justify-between border-t border-line pt-6"><div className="ef-skeleton h-10 w-24" /><div className="ef-skeleton h-10 w-28" /></div></div>)}</div></div>
}
