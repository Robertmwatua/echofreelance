import Link from 'next/link'
import { useRouter } from 'next/router'
import { FormEvent, useEffect, useState } from 'react'
import DocumentHead from '../../../components/DocumentHead'
import { RequireRole } from '../../../components/RequireRole'
import { api, CATEGORIES, Course } from '../../../lib/api'

export default function TutorCourseManagePage() {
  return (
    <RequireRole roles={['Tutor', 'Admin']}>
      {() => <ManageCourse />}
    </RequireRole>
  )
}

function ManageCourse() {
  const router = useRouter()
  const id = typeof router.query.id === 'string' ? router.query.id : ''
  const [course, setCourse] = useState<Course | null>(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('Cybersecurity')
  const [level, setLevel] = useState('Beginner')
  const [priceCents, setPriceCents] = useState(0)
  const [published, setPublished] = useState(false)

  const [lessonTitle, setLessonTitle] = useState('')
  const [lessonContent, setLessonContent] = useState('')
  const [lessonMinutes, setLessonMinutes] = useState(30)
  const [assignTitle, setAssignTitle] = useState('')
  const [assignInstructions, setAssignInstructions] = useState('')
  const [announceTitle, setAnnounceTitle] = useState('')
  const [announceBody, setAnnounceBody] = useState('')
  const [resourceLessonId, setResourceLessonId] = useState('')
  const [resourceTitle, setResourceTitle] = useState('')
  const [resourceUrl, setResourceUrl] = useState('')

  async function load() {
    if (!id) return
    const data = await api.course(id)
    setCourse(data)
    setTitle(data.title)
    setDescription(data.description)
    setCategory(data.category || 'Cybersecurity')
    setLevel(data.level)
    setPriceCents(data.priceCents)
    setPublished(data.published)
  }

  useEffect(() => {
    load().catch((e: Error) => setError(e.message))
  }, [id])

  async function saveCourse(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    setMessage('')
    try {
      await api.updateCourse(id, {
        title,
        description,
        category,
        level,
        priceCents,
        published,
      })
      await load()
      setMessage('Course saved.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setBusy(false)
    }
  }

  async function addLesson(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    setMessage('')
    try {
      await api.addLesson(id, {
        title: lessonTitle,
        content: lessonContent,
        durationMinutes: lessonMinutes,
      })
      setLessonTitle('')
      setLessonContent('')
      await load()
      setMessage('Lesson added.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add lesson')
    } finally {
      setBusy(false)
    }
  }

  async function addAssignment(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    setMessage('')
    try {
      await api.createAssignment({
        courseId: id,
        title: assignTitle,
        instructions: assignInstructions,
      })
      setAssignTitle('')
      setAssignInstructions('')
      setMessage('Assignment published.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create assignment')
    } finally {
      setBusy(false)
    }
  }

  async function postAnnouncement(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    setMessage('')
    try {
      await api.createAnnouncement({
        courseId: id,
        title: announceTitle,
        body: announceBody,
      })
      setAnnounceTitle('')
      setAnnounceBody('')
      setMessage('Announcement sent to enrolled students.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not post announcement')
    } finally {
      setBusy(false)
    }
  }

  async function addResource(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    setMessage('')
    try {
      await api.addResource({
        lessonId: resourceLessonId,
        title: resourceTitle,
        url: resourceUrl,
      })
      setResourceTitle('')
      setResourceUrl('')
      await load()
      setMessage('Resource added to lesson.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add resource')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <DocumentHead title={course ? `Manage ${course.title}` : 'Manage course'} />
      <main className="mx-auto max-w-3xl px-5 py-12">
        <Link href="/tutor" className="text-sm text-fern hover:underline">
          ← Tutor desk
        </Link>
        <h1 className="mt-4 font-display text-4xl text-moss">Manage course</h1>
        {!course && !error && <p className="mt-6 text-ink/60">Loading…</p>}
        {error && <p className="mt-6 text-red-700">{error}</p>}
        {message && <p className="mt-4 text-fern">{message}</p>}

        {course && (
          <>
            <form onSubmit={saveCourse} className="mt-8 space-y-4">
              <label className="block text-sm">
                <span className="mb-1 block font-medium">Title</span>
                <input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-md border border-moss/20 bg-white/70 px-3 py-2"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium">Description</span>
                <textarea
                  required
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-md border border-moss/20 bg-white/70 px-3 py-2"
                />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm">
                  <span className="mb-1 block font-medium">Category</span>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-md border border-moss/20 bg-white/70 px-3 py-2"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block font-medium">Level</span>
                  <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    className="w-full rounded-md border border-moss/20 bg-white/70 px-3 py-2"
                  >
                    <option>Beginner</option>
                    <option>Intermediate</option>
                    <option>Advanced</option>
                  </select>
                </label>
              </div>
              <label className="block text-sm">
                <span className="mb-1 block font-medium">Price (cents)</span>
                <input
                  type="number"
                  min={0}
                  value={priceCents}
                  onChange={(e) => setPriceCents(Number(e.target.value))}
                  className="w-full rounded-md border border-moss/20 bg-white/70 px-3 py-2"
                />
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={published}
                  onChange={(e) => setPublished(e.target.checked)}
                />
                Published in catalog
              </label>
              <button
                type="submit"
                disabled={busy}
                className="rounded-md bg-moss px-5 py-3 text-sm font-semibold text-sand disabled:opacity-60"
              >
                Save course
              </button>
            </form>

            <section className="mt-12">
              <h2 className="font-display text-2xl text-moss">Lessons</h2>
              <ul className="mt-4 space-y-3">
                {(course.lessons || []).map((lesson) => (
                  <li key={lesson.id} className="border-t border-moss/10 pt-3">
                    <p className="font-medium">
                      {lesson.order + 1}. {lesson.title}
                    </p>
                    <p className="text-sm text-ink/55">{lesson.durationMinutes} min</p>
                    {(lesson.resources || []).length > 0 && (
                      <ul className="mt-1 text-xs text-ink/50">
                        {lesson.resources!.map((r) => (
                          <li key={r.id}>
                            Resource: {r.title}
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>

              <form onSubmit={addLesson} className="mt-6 space-y-3 border-t border-line/30 pt-6">
                <h3 className="font-semibold">Add lesson</h3>
                <input
                  required
                  placeholder="Lesson title"
                  value={lessonTitle}
                  onChange={(e) => setLessonTitle(e.target.value)}
                  className="ef-input text-sm"
                />
                <textarea
                  required
                  placeholder="Lesson content / lab brief"
                  rows={4}
                  value={lessonContent}
                  onChange={(e) => setLessonContent(e.target.value)}
                  className="ef-input text-sm"
                />
                <input
                  type="number"
                  min={1}
                  value={lessonMinutes}
                  onChange={(e) => setLessonMinutes(Number(e.target.value))}
                  className="ef-input w-40 text-sm"
                />
                <button type="submit" disabled={busy} className="ef-btn-ghost">
                  Add lesson
                </button>
              </form>

              {(course.lessons || []).length > 0 && (
                <form onSubmit={addResource} className="mt-6 space-y-3 border-t border-line/30 pt-6">
                  <h3 className="font-semibold">Add lesson resource</h3>
                  <select
                    required
                    value={resourceLessonId}
                    onChange={(e) => setResourceLessonId(e.target.value)}
                    className="ef-input text-sm"
                  >
                    <option value="">Select lesson</option>
                    {(course.lessons || []).map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.order + 1}. {l.title}
                      </option>
                    ))}
                  </select>
                  <input
                    required
                    placeholder="Resource title"
                    value={resourceTitle}
                    onChange={(e) => setResourceTitle(e.target.value)}
                    className="ef-input text-sm"
                  />
                  <input
                    required
                    type="url"
                    placeholder="https://…"
                    value={resourceUrl}
                    onChange={(e) => setResourceUrl(e.target.value)}
                    className="ef-input text-sm"
                  />
                  <button type="submit" disabled={busy} className="ef-btn-ghost">
                    Add resource
                  </button>
                </form>
              )}
            </section>

            <section className="mt-12">
              <h2 className="font-display text-2xl text-moss">Announcements</h2>
              <form onSubmit={postAnnouncement} className="mt-4 space-y-3">
                <input
                  required
                  placeholder="Title"
                  value={announceTitle}
                  onChange={(e) => setAnnounceTitle(e.target.value)}
                  className="ef-input text-sm"
                />
                <textarea
                  required
                  placeholder="Message to enrolled students"
                  rows={3}
                  value={announceBody}
                  onChange={(e) => setAnnounceBody(e.target.value)}
                  className="ef-input text-sm"
                />
                <button type="submit" disabled={busy} className="ef-btn-ghost">
                  Post announcement
                </button>
              </form>
            </section>

            <section className="mt-12">
              <h2 className="font-display text-2xl text-moss">Assignments</h2>
              <form onSubmit={addAssignment} className="mt-4 space-y-3">
                <input
                  required
                  placeholder="Assignment title"
                  value={assignTitle}
                  onChange={(e) => setAssignTitle(e.target.value)}
                  className="ef-input text-sm"
                />
                <textarea
                  required
                  placeholder="Instructions"
                  rows={3}
                  value={assignInstructions}
                  onChange={(e) => setAssignInstructions(e.target.value)}
                  className="ef-input text-sm"
                />
                <button type="submit" disabled={busy} className="ef-btn">
                  Publish assignment
                </button>
              </form>
            </section>
          </>
        )}
      </main>
    </>
  )
}
