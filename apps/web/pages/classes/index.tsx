import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import DocumentHead from '../../components/DocumentHead'
import {
  api,
  classStatusLabel,
  formatWhen,
  googleCalendarUrl,
  VirtualClass,
} from '../../lib/api'

function StatusPill({ status }: { status: string }) {
  if (status === 'Live') {
    return (
      <span className="ef-pill-live">
        <span className="ef-pulse-dot" aria-hidden />
        {classStatusLabel(status)}
      </span>
    )
  }
  if (status === 'Completed') {
    return <span className="ef-pill-done">{classStatusLabel(status)}</span>
  }
  return <span className="ef-pill-scheduled">{classStatusLabel(status)}</span>
}

export default function ClassesPage() {
  const [classes, setClasses] = useState<VirtualClass[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .classes()
      .then(setClasses)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const liveCount = useMemo(() => classes.filter((c) => c.status === 'Live').length, [classes])

  return (
    <>
      <DocumentHead title="Live classes — EchoFreelance Tech School" />
      <main className="mx-auto max-w-6xl px-5 py-12">
        <div className="ef-rise max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-fern">Campus live</p>
          <h1 className="mt-2 font-display text-4xl text-moss sm:text-5xl">Virtual classroom</h1>
          <p className="mt-3 text-ink/70">
            Live labs and office hours in the browser. Enroll in the course, register for a session,
            then enter when it opens.
          </p>
          {!loading && classes.length > 0 && (
            <p className="mt-4 text-sm text-ink/55">
              {liveCount > 0 ? (
                <>
                  <span className="ef-pill-live mr-2">
                    <span className="ef-pulse-dot" aria-hidden />
                    {liveCount} live
                  </span>
                  {classes.length} upcoming on the board
                </>
              ) : (
                <>{classes.length} sessions on the board</>
              )}
            </p>
          )}
        </div>

        {loading && <p className="mt-10 text-ink/60">Loading schedule…</p>}
        {error && <p className="mt-10 text-red-400">{error}</p>}

        <ul className="mt-10 grid gap-4 sm:grid-cols-2">
          {classes.map((item, i) => (
            <li
              key={item.id}
              className="ef-session-card ef-rise"
              style={{ animationDelay: `${Math.min(i, 6) * 60}ms` }}
            >
              <div className="flex flex-wrap items-center gap-2">
                <StatusPill status={item.status} />
                <span className="text-xs text-ink/45">{formatWhen(item.startsAt)}</span>
              </div>
              <Link
                href={`/classes/${item.id}`}
                className="mt-3 block font-display text-2xl leading-tight text-ink transition hover:text-moss"
              >
                {item.title}
              </Link>
              {item.description && (
                <p className="mt-2 line-clamp-2 text-sm text-ink/65">{item.description}</p>
              )}
              <p className="mt-3 text-sm text-ink/50">
                {item.course?.title}
                {item.host?.name ? ` · ${item.host.name}` : ''}
                {typeof item.attendanceCount === 'number'
                  ? ` · ${item.attendanceCount} registered`
                  : ''}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link href={`/classes/${item.id}`} className="ef-btn !py-2 text-xs">
                  Open session
                </Link>
                <a
                  href={googleCalendarUrl({
                    title: item.title,
                    details: item.description || `Live class · ${item.course?.title || 'EchoFreelance Tech School'}`,
                    startsAt: item.startsAt,
                    endsAt: item.endsAt,
                    location: 'EchoFreelance Tech School · in-browser classroom',
                  })}
                  target="_blank"
                  rel="noreferrer"
                  className="ef-btn-ghost !py-2 text-xs"
                >
                  Add to Calendar
                </a>
              </div>
            </li>
          ))}
        </ul>

        {!loading && !error && classes.length === 0 && (
          <div className="ef-panel mt-10 max-w-xl">
            <p className="font-display text-xl text-moss">No live sessions yet</p>
            <p className="mt-2 text-sm text-ink/60">
              Tutors schedule virtual classes from the tutor desk — students register and join in
              the browser.
            </p>
            <Link href="/courses" className="ef-btn mt-5 inline-flex">
              Browse courses
            </Link>
          </div>
        )}
      </main>
    </>
  )
}
