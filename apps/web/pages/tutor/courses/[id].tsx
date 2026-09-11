import Link from 'next/link'
import { useRouter } from 'next/router'
import { FormEvent, useEffect, useState } from 'react'
import DocumentHead from '../../../components/DocumentHead'
import { CategoryField } from '../../../components/CategoryField'
import { RequireRole } from '../../../components/RequireRole'
import { api, CATEGORIES, Course, CourseStudentReport } from '../../../lib/api'

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
  const [report, setReport] = useState<CourseStudentReport | null>(null)
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
  const [notifyTitle, setNotifyTitle] = useState('')
  const [notifyBody, setNotifyBody] = useState('')
  const [knownCategories, setKnownCategories] = useState<string[]>([])

  async function load() {
    if (!id) return
    const [data, students, taught, catalog] = await Promise.all([
      api.course(id),
      api.courseStudents(id).catch(() => null),
      api.taughtCourses().catch(() => [] as Course[]),
      api.courses().catch(() => [] as Course[]),
    ])
    setCourse(data)
    setReport(students)
    setTitle(data.title)
    setDescription(data.description)
    setCategory(data.category || 'Cybersecurity')
    setLevel(data.level)
    setPriceCents(data.priceCents)
    setPublished(data.published)
    const cats = [...taught, ...catalog].map((c) => c.category).filter(Boolean)
    setKnownCategories(Array.from(new Set(cats)))
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
        category: category.trim() || 'General',
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

  async function sendNotify(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const res = await api.notifyCourse(id, {
        title: notifyTitle,
        body: notifyBody,
      })
      setNotifyTitle('')
      setNotifyBody('')
      setMessage(`Notification sent to ${res.notified} student(s).`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send notification')
    } finally {
      setBusy(false)
    }
  }

  async function deleteCourse() {
    if (!window.confirm('Delete this course and all its lessons, classes, and enrollments?')) {
      return
    }
    setBusy(true)
    setError('')
    try {
      await api.deleteCourse(id)
      router.push('/tutor')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete course')
      setBusy(false)
    }
  }

  return (
    <>
      <DocumentHead title={course ? `Manage ${course.title}` : 'Manage course'} />
      <main className="relative mx-auto max-w-3xl px-5 py-12">
        <div
          className="pointer-events-none absolute inset-x-0 -top-8 h-40 opacity-25"
          style={{
            background:
              'radial-gradient(ellipse 60% 80% at 10% 0%, rgba(45,212,191,0.3), transparent)',
          }}
          aria-hidden
        />
        <div className="relative">
        <Link href="/tutor" className="ef-link text-sm">
          ← Tutor desk
        </Link>
        <h1 className="mt-4 font-display text-4xl text-moss sm:text-5xl">Manage course</h1>
        {!course && !error && <p className="mt-6 text-ink/60">Loading…</p>}
        {error && <p className="mt-6 text-red-400">{error}</p>}
        {message && <p className="mt-4 text-moss">{message}</p>}

        {course && (
          <>
            <form onSubmit={saveCourse} className="ef-panel mt-8 space-y-4">
              <label className="block text-sm">
                <span className="mb-1.5 block font-medium text-ink/85">Title</span>
                <input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="ef-input"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium">Description</span>
                <textarea
                  required
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="ef-input"
                />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm">
                  <span className="mb-1.5 block font-medium text-ink/85">Category</span>
                  <CategoryField
                    value={category}
                    onChange={setCategory}
                    suggestions={[...CATEGORIES, ...knownCategories]}
                  />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block font-medium">Level</span>
                  <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    className="ef-input"
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
                  className="ef-input"
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
              <button type="submit" disabled={busy} className="ef-btn">
                Save course
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={deleteCourse}
                className="ml-3 rounded-md border border-red-500/40 px-5 py-3 text-sm font-semibold text-red-400 hover:bg-red-500/10 disabled:opacity-60"
              >
                Delete course
              </button>
            </form>

            <section className="ef-panel mt-10">
              <h2 className="font-display text-2xl text-moss">Student performance</h2>
              <p className="ef-muted mt-1 text-sm">
                {report ? `${report.studentCount} enrolled` : 'Loading roster…'}
              </p>
              {report && report.students.length === 0 && (
                <p className="mt-4 text-sm text-ink/55">No students enrolled yet.</p>
              )}
              {report && report.students.length > 0 && (
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full min-w-[520px] text-left text-sm">
                    <thead className="border-b border-line/40 text-xs uppercase tracking-wide text-ink/50">
                      <tr>
                        <th className="py-2 pr-3 font-medium">Student</th>
                        <th className="py-2 pr-3 font-medium">Progress</th>
                        <th className="py-2 pr-3 font-medium">Assignments</th>
                        <th className="py-2 font-medium">Avg grade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.students.map((s) => (
                        <tr key={s.id} className="border-b border-line/20">
                          <td className="py-3 pr-3">
                            <p className="font-medium">{s.name || 'Student'}</p>
                            <p className="text-xs text-ink/45">{s.email}</p>
                          </td>
                          <td className="py-3 pr-3">
                            {s.progressPercent}% ({s.lessonsCompleted}/{s.lessonsTotal})
                          </td>
                          <td className="py-3 pr-3">
                            {s.assignmentsSubmitted}/{s.assignmentsTotal}
                          </td>
                          <td className="py-3">
                            {s.avgGrade != null ? s.avgGrade : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className="ef-panel mt-8">
              <h2 className="font-display text-2xl text-moss">Notify students</h2>
              <p className="ef-muted mt-1 text-sm">
                Sends an in-app alert to everyone enrolled (shows under Alerts).
              </p>
              <form onSubmit={sendNotify} className="mt-4 space-y-3">
                <input
                  required
                  placeholder="Notification title"
                  value={notifyTitle}
                  onChange={(e) => setNotifyTitle(e.target.value)}
                  className="ef-input text-sm"
                />
                <textarea
                  required
                  placeholder="Short message"
                  rows={3}
                  value={notifyBody}
                  onChange={(e) => setNotifyBody(e.target.value)}
                  className="ef-input text-sm"
                />
                <button type="submit" disabled={busy} className="ef-btn-ghost">
                  Send notification
                </button>
              </form>
            </section>

            <section className="ef-panel mt-8">
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

            <section className="ef-panel mt-8">
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

            <section className="ef-panel mt-8">
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
        </div>
      </main>
    </>
  )
}
