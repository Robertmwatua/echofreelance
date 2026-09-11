import Link from 'next/link'
import { useRouter } from 'next/router'
import { FormEvent, useEffect, useState } from 'react'
import DocumentHead from '../../../components/DocumentHead'
import { RequireRole } from '../../../components/RequireRole'
import { api, Course } from '../../../lib/api'

export default function NewClassPage() {
  return (
    <RequireRole roles={['Tutor', 'Admin']}>
      {() => <NewClassForm />}
    </RequireRole>
  )
}

function NewClassForm() {
  const router = useRouter()
  const [courses, setCourses] = useState<Course[]>([])
  const [courseId, setCourseId] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startsAt, setStartsAt] = useState('')
  const [endsAt, setEndsAt] = useState('')
  const [customUrl, setCustomUrl] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    api
      .taughtCourses()
      .then((c) => {
        setCourses(c)
        if (c[0]) setCourseId(c[0].id)
      })
      .catch((e: Error) => setError(e.message))
  }, [])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const created = await api.createClass({
        courseId,
        title,
        description: description || undefined,
        startsAt: new Date(startsAt).toISOString(),
        endsAt: new Date(endsAt).toISOString(),
        meetingUrl: customUrl || undefined,
      })
      router.push(`/classes/${created.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not schedule class')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <DocumentHead title="Schedule live class — Tutor" />
      <main className="mx-auto max-w-2xl px-5 py-12">
        <Link href="/tutor" className="text-sm text-fern hover:underline">
          ← Tutor desk
        </Link>
        <h1 className="mt-4 font-display text-4xl text-moss">Schedule a live class</h1>
        <p className="ef-muted mt-2">
          A private classroom room is created automatically (in-browser video). Optional: paste your
          own Meet/Zoom link instead.
        </p>
        <form onSubmit={onSubmit} className="ef-panel mt-8 space-y-4">
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Course</span>
            <select
              required
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="ef-input"
            >
              {courses.length === 0 && <option value="">Create a course first</option>}
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Session title</span>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="ef-input"
              placeholder="e.g. Live lab: phishing triage"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Description</span>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="ef-input"
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Starts</span>
              <input
                required
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                className="ef-input"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Ends</span>
              <input
                required
                type="datetime-local"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                className="ef-input"
              />
            </label>
          </div>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Custom meeting URL (optional)</span>
            <input
              type="url"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              className="ef-input"
              placeholder="Leave blank for built-in live classroom"
            />
          </label>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button type="submit" disabled={busy || !courseId} className="ef-btn">
            {busy ? 'Scheduling…' : 'Publish session'}
          </button>
        </form>
      </main>
    </>
  )
}
