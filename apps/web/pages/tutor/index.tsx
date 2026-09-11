import Link from 'next/link'
import { useRouter } from 'next/router'
import { FormEvent, useEffect, useState } from 'react'
import DocumentHead from '../../components/DocumentHead'
import { RequireRole } from '../../components/RequireRole'
import { api, Course, formatWhen, VirtualClass } from '../../lib/api'

export default function TutorDeskPage() {
  return (
    <RequireRole roles={['Tutor', 'Admin']}>
      {() => <TutorDesk />}
    </RequireRole>
  )
}

function TutorDesk() {
  const router = useRouter()
  const [courses, setCourses] = useState<Course[]>([])
  const [classes, setClasses] = useState<VirtualClass[]>([])
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [instantCourseId, setInstantCourseId] = useState('')
  const [instantTitle, setInstantTitle] = useState('')
  const [instantDuration, setInstantDuration] = useState(60)
  const [starting, setStarting] = useState(false)
  const [busyId, setBusyId] = useState('')
  const [liveOk, setLiveOk] = useState<boolean | null>(null)
  const [liveHint, setLiveHint] = useState('')

  async function reload() {
    const [c, cl] = await Promise.all([api.taughtCourses(), api.myClasses()])
    setCourses(c)
    setClasses(cl.slice(0, 8))
    if (c[0]) setInstantCourseId((prev) => prev || c[0].id)
  }

  useEffect(() => {
    reload().catch((e: Error) => setError(e.message))
    api
      .liveClassroomStatus()
      .then((s) => {
        setLiveOk(s.configured)
        setLiveHint(s.privateKeyHint || '')
      })
      .catch(() => setLiveOk(null))
  }, [])

  async function startInstant(e: FormEvent) {
    e.preventDefault()
    if (!instantCourseId) {
      setError('Create a course first, then start an instant meeting under it.')
      return
    }
    setStarting(true)
    setError('')
    try {
      const meeting = await api.startInstantMeeting({
        courseId: instantCourseId,
        title: instantTitle.trim() || undefined,
        durationMinutes: instantDuration,
      })
      router.push(`/classes/${meeting.id}/room`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start meeting')
      setStarting(false)
    }
  }

  async function removeCourse(courseId: string, title: string) {
    if (!window.confirm(`Delete “${title}”? This cannot be undone.`)) return
    setBusyId(courseId)
    setError('')
    setMessage('')
    try {
      await api.deleteCourse(courseId)
      await reload()
      setMessage('Course deleted.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete course')
    } finally {
      setBusyId('')
    }
  }

  return (
    <>
      <DocumentHead title="Tutor desk — EchoFreelance Tech School" />
      <main className="mx-auto max-w-6xl px-5 py-12">
        <p className="text-xs font-semibold uppercase tracking-wider text-fern">Tutor</p>
        <h1 className="mt-1 font-display text-4xl text-moss">Tutor desk</h1>
        <p className="ef-muted mt-2">
          Create and manage courses, track students, notify your class, and run live sessions.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/tutor/courses/new" className="ef-btn">
            New course
          </Link>
          <Link href="/tutor/classes/new" className="ef-btn-ghost">
            Schedule live class
          </Link>
          <Link href="/discussions" className="ef-btn-ghost">
            Discussions
          </Link>
          <Link href="/settings" className="ef-btn-ghost">
            Settings
          </Link>
        </div>

        <section className="ef-panel mt-10">
          <h2 className="font-display text-2xl text-moss">Start instant meeting</h2>
          <p className="ef-muted mt-2 text-sm">
            Goes live immediately and opens the classroom. Enrolled students can join from Live
            classes.
          </p>
          {liveOk === false && (
            <p className="mt-3 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
              Live video key problem on the API (Render).{' '}
              {liveHint && liveHint !== 'ok' ? (
                <>
                  Hint: <span className="text-amber-100">{liveHint}</span>
                </>
              ) : (
                <>
                  Check <code className="text-xs">JAAS_PRIVATE_KEY</code> is the{' '}
                  <strong>private</strong> PEM (BEGIN PRIVATE KEY), not the public .pub file — then
                  Manual Deploy.
                </>
              )}
            </p>
          )}
          {courses.length === 0 ? (
            <p className="mt-4 text-sm text-ink/65">
              You need a course first.{' '}
              <Link href="/tutor/courses/new" className="text-fern hover:underline">
                Create one →
              </Link>
            </p>
          ) : (
            <form onSubmit={startInstant} className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <label className="block text-sm sm:col-span-2 lg:col-span-1">
                <span className="mb-1 block font-medium">Course</span>
                <select
                  required
                  className="ef-input"
                  value={instantCourseId}
                  onChange={(e) => setInstantCourseId(e.target.value)}
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm sm:col-span-2 lg:col-span-1">
                <span className="mb-1 block font-medium">Title (optional)</span>
                <input
                  className="ef-input"
                  placeholder="e.g. Office hours"
                  value={instantTitle}
                  onChange={(e) => setInstantTitle(e.target.value)}
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium">Duration</span>
                <select
                  className="ef-input"
                  value={instantDuration}
                  onChange={(e) => setInstantDuration(Number(e.target.value))}
                >
                  <option value={30}>30 min</option>
                  <option value={60}>60 min</option>
                  <option value={90}>90 min</option>
                  <option value={120}>2 hours</option>
                </select>
              </label>
              <div className="flex items-end">
                <button type="submit" disabled={starting} className="ef-btn w-full">
                  {starting ? 'Starting…' : 'Start now'}
                </button>
              </div>
            </form>
          )}
        </section>

        {error && <p className="mt-6 text-red-400">{error}</p>}
        {message && <p className="mt-6 text-moss">{message}</p>}

        <section className="mt-12">
          <h2 className="font-display text-2xl text-moss">Your courses</h2>
          <ul className="mt-4 space-y-4">
            {courses.map((course) => (
              <li key={course.id} className="border-t border-line/30 pt-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <Link
                      href={`/tutor/courses/${course.id}`}
                      className="font-display text-xl hover:text-moss"
                    >
                      {course.title}
                    </Link>
                    <p className="text-sm text-ink/55">
                      {course.category} · {course.published ? 'Published' : 'Draft'} ·{' '}
                      {course.enrollmentCount ?? 0} students · {course.lessonCount ?? 0} lessons
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3 text-sm font-semibold">
                    <Link
                      href={`/tutor/courses/${course.id}`}
                      className="text-fern hover:underline"
                    >
                      Manage
                    </Link>
                    <button
                      type="button"
                      disabled={busyId === course.id}
                      onClick={() => removeCourse(course.id, course.title)}
                      className="text-red-400 hover:underline disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          {courses.length === 0 && (
            <p className="mt-4 text-ink/60">No courses yet — create your first program.</p>
          )}
        </section>

        <section className="mt-12">
          <h2 className="font-display text-2xl text-moss">Your live classes</h2>
          <ul className="mt-4 space-y-4">
            {classes.map((item) => (
              <li key={item.id} className="border-t border-line/30 pt-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <Link
                      href={`/classes/${item.id}`}
                      className="font-display text-xl hover:text-moss"
                    >
                      {item.title}
                    </Link>
                    <p className="text-sm text-ink/55">
                      {formatWhen(item.startsAt)} · {item.status}
                    </p>
                  </div>
                  {item.status === 'Live' && (
                    <Link href={`/classes/${item.id}/room`} className="ef-btn !py-2">
                      Rejoin room
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </>
  )
}
