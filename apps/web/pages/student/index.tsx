import Link from 'next/link'
import { useEffect, useState } from 'react'
import DocumentHead from '../../components/DocumentHead'
import { ProgressBar } from '../../components/ProgressBar'
import { RequireRole } from '../../components/RequireRole'
import { api, formatWhen, VirtualClass } from '../../lib/api'

export default function StudentHubPage() {
  return (
    <RequireRole roles={['Student', 'Tutor', 'Admin']}>
      {(user) => <StudentHub userName={user.name || user.email} />}
    </RequireRole>
  )
}

function StudentHub({ userName }: { userName: string }) {
  const [progress, setProgress] = useState<
    Array<{
      courseId: string
      title: string
      category: string
      total: number
      completed: number
      percent: number
    }>
  >([])
  const [classes, setClasses] = useState<VirtualClass[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([api.myProgress(), api.classes()])
      .then(([p, cl]) => {
        setProgress(p)
        setClasses(cl.slice(0, 5))
      })
      .catch((e: Error) => setError(e.message))
  }, [])

  return (
    <>
      <DocumentHead title="Student hub — EchoFreelance" />
      <main className="mx-auto max-w-6xl px-5 py-12">
        <p className="text-xs font-semibold uppercase tracking-wider text-fern">Student</p>
        <h1 className="mt-1 font-display text-4xl text-moss">Welcome, {userName}</h1>
        <p className="ef-muted mt-2">Track course progress, live classes, and the CTF arena.</p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/courses" className="ef-btn-ghost">
            Catalog
          </Link>
          <Link href="/challenges" className="ef-btn">
            CTF arena
          </Link>
          <Link href="/classes" className="ef-btn-ghost">
            Live classes
          </Link>
          <Link href="/certificates/mine" className="ef-btn-ghost">
            Certificates
          </Link>
        </div>

        {error && <p className="mt-6 text-red-400">{error}</p>}

        <section className="mt-10">
          <h2 className="font-display text-2xl text-moss">Learning progress</h2>
          {progress.length === 0 ? (
            <div className="ef-panel mt-4">
              <p className="text-ink/80">No enrollments yet.</p>
              <Link href="/courses" className="mt-2 inline-block text-sm text-fern hover:underline">
                Browse courses →
              </Link>
            </div>
          ) : (
            <ul className="mt-4 space-y-4">
              {progress.map((row) => (
                <li key={row.courseId} className="ef-panel !p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Link
                      href={`/courses/${row.courseId}`}
                      className="font-display text-xl hover:text-moss"
                    >
                      {row.title}
                    </Link>
                    <span className="text-sm text-ink/55">{row.percent}%</span>
                  </div>
                  <p className="mt-1 text-xs text-ink/50">
                    {row.category} · {row.completed}/{row.total} lessons
                  </p>
                  <ProgressBar percent={row.percent} className="mt-3" />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-12">
          <h2 className="font-display text-2xl text-moss">Upcoming live classes</h2>
          <ul className="mt-4 space-y-3">
            {classes.map((item) => (
              <li key={item.id} className="border-t border-line/30 pt-3">
                <Link href={`/classes/${item.id}`} className="font-display text-xl hover:text-moss">
                  {item.title}
                </Link>
                <p className="text-sm text-ink/55">{formatWhen(item.startsAt)}</p>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </>
  )
}
