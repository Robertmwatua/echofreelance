import Link from 'next/link'
import { useEffect, useState } from 'react'
import DocumentHead from '../../components/DocumentHead'
import { api, formatWhen, VirtualClass } from '../../lib/api'

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

  return (
    <>
      <DocumentHead title="Live classes — EchoFreelance Tech School" />
      <main className="mx-auto max-w-6xl px-5 py-12">
        <h1 className="font-display text-4xl text-moss">Virtual classroom</h1>
        <p className="mt-2 max-w-xl text-ink/70">
          Live labs and office hours. Enroll in the related course, register for the session, then
          join with the meeting link when it opens.
        </p>

        {loading && <p className="mt-10 text-ink/60">Loading schedule…</p>}
        {error && <p className="mt-10 text-red-700">{error}</p>}

        <ul className="mt-10 space-y-8">
          {classes.map((item) => (
            <li key={item.id} className="border-t border-moss/15 pt-8 first:border-t-0 first:pt-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-fern">
                {item.status} · {formatWhen(item.startsAt)}
                {item.course?.category ? ` · ${item.course.category}` : ''}
              </p>
              <Link
                href={`/classes/${item.id}`}
                className="mt-1 block font-display text-2xl hover:text-moss"
              >
                {item.title}
              </Link>
              {item.description && <p className="mt-2 max-w-2xl text-ink/70">{item.description}</p>}
              <p className="mt-2 text-sm text-ink/50">
                {item.course?.title}
                {item.host?.name ? ` · Hosted by ${item.host.name}` : ''}
                {typeof item.attendanceCount === 'number'
                  ? ` · ${item.attendanceCount} registered`
                  : ''}
              </p>
            </li>
          ))}
        </ul>
        {!loading && !error && classes.length === 0 && (
          <div className="ef-panel mt-10">
            <p className="text-ink/85">No live sessions on the board yet.</p>
            <p className="mt-2 text-sm text-ink/60">
              Tutors schedule virtual classes after creating a course — students then register and
              enter the in-browser classroom.
            </p>
          </div>
        )}
      </main>
    </>
  )
}
