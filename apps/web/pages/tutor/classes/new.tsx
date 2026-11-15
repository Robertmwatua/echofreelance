import {Panel,Field} from '../../../components/forms/Fields'
import {Button} from '../../../components/Button'
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
      <main className="mx-auto max-w-2xl px-6 py-12">
        <Link href="/tutor" className="text-sm text-fern hover:underline">
          ← Tutor desk
        </Link>
        <p className="ef-page-label">Schedule / a new session</p><h1 className="mt-4   text-ink ef-staff-title">Make room for questions.</h1>
        <p className="ef-muted mt-2">
          A private classroom room is created automatically (in-browser video). Optional: paste your
          own Meet/Zoom link instead.
        </p>
        <Panel number="01" title="Class details"><form onSubmit={onSubmit} className="ef-panel mt-8 space-y-4">
          <Field label="Course"><select
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
            </select></Field>
          <Field label="Session title"><input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="ef-input"
              placeholder="e.g. Live lab: phishing triage"
            /></Field>
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
            <Field label="Starts"><input
                required
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                className="ef-input"
              /></Field>
            <Field label="Ends"><input
                required
                type="datetime-local"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                className="ef-input"
              /></Field>
          </div>
          <Field label="Custom meeting URL (optional)"><input
              type="url"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              className="ef-input"
              placeholder="Leave blank for built-in live classroom"
            /></Field>
          {error && <p className="text-sm ef-text-danger ef-toast">{error}</p>}
          <Button type="submit" disabled={busy || !courseId} className="ef-btn">
            {busy ? 'Scheduling…' : 'Publish session'}
          </Button>
        </form></Panel>
      </main>
    </>
  )
}
