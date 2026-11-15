import { LessonEditor } from '../../../components/tutor/LessonEditor'
import { CourseFeeEditor } from '../../../components/CourseFeeEditor'
import { RoadmapEditor, roadmapLines } from '../../../components/tutor/RoadmapEditor'
import { useConfirmation } from '../../../components/Confirmation'
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
  const { confirm, confirmation } = useConfirmation()
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
  const [roadmap, setRoadmap] = useState('')
  const [publicPreview, setPublicPreview] = useState(false)
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
    setPublished(data.published)
    setRoadmap((data.roadmap || []).join('\n'))
    setPublicPreview(Boolean(data.publicPreview))
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
        roadmapSteps: roadmapLines(roadmap),
        publicPreview,
        published: published !== course?.published ? published : undefined,
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
      setMessage('Draft lesson added. Edit and publish it when ready.')
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
    if (!await confirm('Delete this course and all its lessons, classes, and enrollments?')) {
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
      {confirmation}<DocumentHead title={course ? `Manage ${course.title}` : 'Manage course'} />
      <main className="relative mx-auto max-w-3xl px-6 py-12">
        <div className="relative">
        <Link href="/tutor" className="ef-link text-sm">
          ← Tutor desk
        </Link>
        <p className="ef-page-label">Workshop / course editor</p><h1 className="mt-4   text-ink  ef-title">Shape the next lesson.</h1>
        {!course && !error && <p className="mt-6 ef-muted">Loading…</p>}
        {error && <p className="mt-6 ef-text-danger ef-toast">{error}</p>}
        {message && <p className="mt-4 text-moss ef-toast">{message}</p>}

        {course && (
          <>
            <form id="details" onSubmit={saveCourse} className="ef-panel mt-8 space-y-4">
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
              <p className="ef-muted text-sm">School fees are set and confirmed by an administrator, in KES.</p>
              <RoadmapEditor value={roadmap} change={setRoadmap} listed={publicPreview} setListed={setPublicPreview}/><label className="flex items-center gap-2 text-sm">
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
                className="ef-btn-ghost ml-3"
              >
                Delete course
              </button>
            </form>
            {course && <CourseFeeEditor course={course} updated={load}/>}

            <section className="ef-panel mt-10">
              <h2 className="font-display text-2xl text-ink" id="students">Student performance</h2>
              <p className="ef-muted mt-1 text-sm">
                {report
                  ? `${report.studentCount} enrolled${
                      report.sessionsTotal != null ? ` · ${report.sessionsTotal} live sessions` : ''
                    }`
                  : 'Loading roster…'}
              </p>
              {report && report.students.length === 0 && (
                <p className="mt-4 text-sm ef-muted">No students enrolled yet.</p>
              )}
              {report && report.students.length > 0 && (
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full min-w-[640px] text-left text-sm">
                    <thead className="border-b border-line text-xs   ef-muted">
                      <tr>
                        <th className="py-2 pr-3 font-medium">Student</th>
                        <th className="py-2 pr-3 font-medium">Progress</th>
                        <th className="py-2 pr-3 font-medium">Attendance</th>
                        <th className="py-2 pr-3 font-medium">Assignments</th>
                        <th className="py-2 font-medium">Avg grade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.students.map((s) => (
                        <tr key={s.id} className="border-b border-line">
                          <td className="py-3 pr-3">
                            <p className="font-medium">{s.name || 'Student'}</p>
                            <p className="text-xs ef-muted">{s.email}</p>
                          </td>
                          <td className="py-3 pr-3">
                            {s.progressPercent}% ({s.lessonsCompleted}/{s.lessonsTotal})
                          </td>
                          <td className="py-3 pr-3">
                            {s.attendancePercent != null
                              ? `${s.attendancePercent}% (${s.sessionsAttended}/${s.sessionsTotal})`
                              : '—'}
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
              <h2 className="font-display text-2xl text-ink">Notify students</h2>
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
              <h2 className="font-display text-2xl text-ink" id="lessons">Lessons</h2>
              <LessonEditor courseId={id} lessons={course.lessons||[]} refresh={load}/>
              <form onSubmit={addLesson} className="mt-6 space-y-3 border-t border-line pt-6">
                <h3 className="font-semibold">Add a draft lesson</h3>
                <label className="block">Lesson title<input required minLength={3} maxLength={200} value={lessonTitle} onChange={e=>setLessonTitle(e.target.value)} className="ef-input mt-2"/></label>
                <label className="block">Teaching notes / lab brief<textarea required minLength={10} maxLength={50000} rows={6} value={lessonContent} onChange={e=>setLessonContent(e.target.value)} className="ef-input mt-2"/></label>
                <label className="block">Duration in minutes<input type="number" required min={1} max={1440} value={lessonMinutes} onChange={e=>setLessonMinutes(Number(e.target.value))} className="ef-input mt-2"/></label>
                <button type="submit" disabled={busy} className="ef-btn-ghost">Add draft lesson</button>
              </form>

              {(course.lessons || []).length > 0 && (
                <form onSubmit={addResource} className="mt-6 space-y-3 border-t border-line pt-6">
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
                        {l.order + 1}. {l.title} ({l.published?'published':'draft'})
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
              <h2 className="font-display text-2xl text-ink">Announcements</h2>
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
              <h2 className="font-display text-2xl text-ink">Assignments</h2>
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
