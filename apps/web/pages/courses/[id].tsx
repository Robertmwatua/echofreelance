import Link from 'next/link'
import { useRouter } from 'next/router'
import { FormEvent, useEffect, useState } from 'react'
import DocumentHead from '../../components/DocumentHead'
import { ProgressBar } from '../../components/ProgressBar'
import {
  api,
  Assignment,
  Course,
  CourseAnnouncement,
  CourseReview,
  DiscussionPost,
  formatPrice,
  getStoredUser,
} from '../../lib/api'

export default function CourseDetailPage() {
  const router = useRouter()
  const id = typeof router.query.id === 'string' ? router.query.id : ''
  const [course, setCourse] = useState<Course | null>(null)
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [announcements, setAnnouncements] = useState<CourseAnnouncement[]>([])
  const [discussions, setDiscussions] = useState<DiscussionPost[]>([])
  const [reviews, setReviews] = useState<{
    average: number
    count: number
    reviews: CourseReview[]
  } | null>(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [submitFor, setSubmitFor] = useState<string | null>(null)
  const [submitText, setSubmitText] = useState('')
  const [rating, setRating] = useState(5)
  const [reviewComment, setReviewComment] = useState('')
  const [discussBody, setDiscussBody] = useState('')
  const [noteLessonId, setNoteLessonId] = useState<string | null>(null)
  const [noteBody, setNoteBody] = useState('')

  async function load() {
    if (!id) return
    const [c, a, an, r, d] = await Promise.all([
      api.course(id),
      api.courseAssignments(id).catch(() => [] as Assignment[]),
      api.courseAnnouncements(id).catch(() => [] as CourseAnnouncement[]),
      api.courseReviews(id).catch(() => null),
      api.courseDiscussions(id).catch(() => [] as DiscussionPost[]),
    ])
    setCourse(c)
    setAssignments(a)
    setAnnouncements(an)
    setReviews(r)
    setDiscussions(d)
  }

  useEffect(() => {
    load().catch((e: Error) => setError(e.message))
  }, [id])

  async function enroll() {
    if (!getStoredUser()) {
      router.push(`/login?next=/courses/${id}`)
      return
    }
    setBusy(true)
    setError('')
    try {
      await api.enroll(id)
      await load()
      setMessage('Enrolled. Lessons unlocked.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Enrollment failed')
    } finally {
      setBusy(false)
    }
  }

  async function completeLesson(lessonId: string) {
    setBusy(true)
    setError('')
    try {
      const result = await api.completeLesson(lessonId)
      await load()
      if (result.certificate) {
        setMessage(`Course complete — certificate ${result.certificate.code} issued.`)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not update progress')
    } finally {
      setBusy(false)
    }
  }

  async function claimCert() {
    setBusy(true)
    setError('')
    try {
      const cert = await api.claimCertificate(id)
      setMessage(`Certificate ready: ${cert.code}`)
      router.push(`/certificates/${cert.code}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not claim certificate')
    } finally {
      setBusy(false)
    }
  }

  async function submitAssignment(e: FormEvent) {
    e.preventDefault()
    if (!submitFor) return
    setBusy(true)
    setError('')
    try {
      await api.submitAssignment(submitFor, { content: submitText })
      setSubmitFor(null)
      setSubmitText('')
      await load()
      setMessage('Assignment submitted.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submit failed')
    } finally {
      setBusy(false)
    }
  }

  async function submitReview(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await api.postReview(id, {
        rating,
        comment: reviewComment.trim() || undefined,
      })
      setReviewComment('')
      await load()
      setMessage('Thanks for your review.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Review failed')
    } finally {
      setBusy(false)
    }
  }

  async function submitDiscussion(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await api.postDiscussion(id, discussBody)
      setDiscussBody('')
      await load()
      setMessage('Posted to discussion.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not post')
    } finally {
      setBusy(false)
    }
  }

  async function openNote(lessonId: string) {
    setNoteLessonId(lessonId)
    setBusy(true)
    try {
      const note = await api.getLessonNote(lessonId)
      setNoteBody(note?.body || '')
    } catch {
      setNoteBody('')
    } finally {
      setBusy(false)
    }
  }

  async function saveNote(e: FormEvent) {
    e.preventDefault()
    if (!noteLessonId) return
    setBusy(true)
    setError('')
    try {
      await api.saveLessonNote(noteLessonId, noteBody)
      setMessage('Note saved.')
      setNoteLessonId(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save note')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <DocumentHead title={course ? `${course.title} — EchoFreelance` : 'Course'} />
      <main className="mx-auto max-w-3xl px-5 py-12">
        <Link href="/courses" className="text-sm text-fern hover:underline">
          ← Catalog
        </Link>
        {error && !course && <p className="mt-8 text-red-400">{error}</p>}
        {course && (
          <>
            <div className="ef-panel mt-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-fern">
                {course.category} · {course.level} · {formatPrice(course.priceCents)}
                {reviews && reviews.count > 0 ? ` · ${reviews.average}★ (${reviews.count})` : ''}
              </p>
              <h1 className="mt-2 font-display text-4xl text-moss">{course.title}</h1>
              <p className="ef-muted mt-4 text-lg">{course.description}</p>

              {course.progress && (
                <div className="mt-6">
                  <div className="mb-2 flex justify-between text-sm text-ink/70">
                    <span>Your progress</span>
                    <span>
                      {course.progress.completed}/{course.progress.total} · {course.progress.percent}%
                    </span>
                  </div>
                  <ProgressBar percent={course.progress.percent} />
                </div>
              )}

              <div className="mt-8 flex flex-wrap gap-3">
                {course.enrolled ? (
                  <Link href="/student" className="ef-btn">
                    Student hub
                  </Link>
                ) : (
                  <button type="button" disabled={busy} onClick={enroll} className="ef-btn">
                    {busy ? 'Enrolling…' : 'Enroll'}
                  </button>
                )}
                {course.enrolled && course.progress && course.progress.percent === 100 && (
                  <button type="button" disabled={busy} onClick={claimCert} className="ef-btn-ghost">
                    Get certificate
                  </button>
                )}
                {course.canManage && (
                  <Link href={`/tutor/courses/${course.id}`} className="ef-btn-ghost">
                    Manage
                  </Link>
                )}
              </div>
              {message && <p className="mt-4 text-moss">{message}</p>}
              {error && course && <p className="mt-4 text-red-400">{error}</p>}
            </div>

            {announcements.length > 0 && (
              <section className="mt-10">
                <h2 className="font-display text-2xl text-moss">Announcements</h2>
                <ul className="mt-4 space-y-3">
                  {announcements.map((a) => (
                    <li key={a.id} className="ef-panel !p-4">
                      <p className="font-medium">{a.title}</p>
                      <p className="ef-muted mt-1 text-sm whitespace-pre-wrap">{a.body}</p>
                      <p className="mt-2 text-xs text-ink/45">
                        {a.author?.name || 'Tutor'} · {new Date(a.createdAt).toLocaleDateString()}
                      </p>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section className="mt-10">
              <h2 className="font-display text-2xl text-moss">Syllabus</h2>
              <ul className="mt-4 space-y-4">
                {(course.lessons || []).map((lesson) => (
                  <li key={lesson.id} className="ef-panel !p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">
                          {lesson.order + 1}. {lesson.title}
                          {lesson.locked ? (
                            <span className="ml-2 text-xs uppercase text-ink/40">Locked</span>
                          ) : null}
                          {lesson.completed ? (
                            <span className="ml-2 text-xs uppercase text-moss">Done</span>
                          ) : null}
                        </p>
                        <p className="text-sm text-ink/55">{lesson.durationMinutes} min</p>
                        {!lesson.locked && lesson.content && (
                          <p className="ef-muted mt-2 text-sm">{lesson.content}</p>
                        )}
                        {!lesson.locked && lesson.resources && lesson.resources.length > 0 && (
                          <ul className="mt-3 space-y-1 text-sm">
                            {lesson.resources.map((r) => (
                              <li key={r.id}>
                                <a
                                  href={r.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-fern hover:underline"
                                >
                                  {r.title}
                                </a>
                                <span className="ml-2 text-xs uppercase text-ink/40">{r.kind}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      {!lesson.locked && course.enrolled && (
                        <div className="flex flex-col gap-2">
                          {!lesson.completed && (
                            <button
                              type="button"
                              disabled={busy}
                              className="ef-btn-ghost !py-1.5 text-xs"
                              onClick={() => completeLesson(lesson.id)}
                            >
                              Mark complete
                            </button>
                          )}
                          <button
                            type="button"
                            className="ef-btn-ghost !py-1.5 text-xs"
                            onClick={() => openNote(lesson.id)}
                          >
                            Notes
                          </button>
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>

              {noteLessonId && (
                <form onSubmit={saveNote} className="ef-panel mt-4 space-y-3">
                  <h3 className="font-semibold">Lesson notes</h3>
                  <textarea
                    rows={5}
                    className="ef-input"
                    value={noteBody}
                    onChange={(e) => setNoteBody(e.target.value)}
                    placeholder="Private notes for this lesson…"
                  />
                  <div className="flex gap-2">
                    <button type="submit" disabled={busy} className="ef-btn">
                      Save note
                    </button>
                    <button
                      type="button"
                      className="ef-btn-ghost"
                      onClick={() => setNoteLessonId(null)}
                    >
                      Close
                    </button>
                  </div>
                </form>
              )}
            </section>

            <section id="discussion" className="mt-10 scroll-mt-24">
              <h2 className="font-display text-2xl text-moss">Discussion</h2>
              <p className="ef-muted mt-1 text-sm">Ask questions and share insights with the class.</p>
              <ul className="mt-4 space-y-3">
                {discussions.length === 0 && (
                  <li className="ef-muted text-sm">No posts yet.</li>
                )}
                {discussions.map((p) => (
                  <li key={p.id} className="ef-panel !p-4">
                    <p className="text-sm font-medium text-ink">
                      {p.author.name || 'Member'}
                      <span className="ml-2 text-xs font-normal uppercase text-ink/40">
                        {p.author.role}
                      </span>
                    </p>
                    <p className="ef-muted mt-2 whitespace-pre-wrap text-sm">{p.body}</p>
                    <p className="mt-2 text-xs text-ink/40">
                      {new Date(p.createdAt).toLocaleString()}
                    </p>
                  </li>
                ))}
              </ul>
              {(course.enrolled || course.canManage) && (
                <form onSubmit={submitDiscussion} className="ef-panel mt-4 space-y-3">
                  <textarea
                    required
                    minLength={2}
                    rows={3}
                    className="ef-input"
                    value={discussBody}
                    onChange={(e) => setDiscussBody(e.target.value)}
                    placeholder="Write a comment…"
                  />
                  <button type="submit" disabled={busy} className="ef-btn">
                    Post
                  </button>
                </form>
              )}
            </section>

            <section className="mt-10">
              <h2 className="font-display text-2xl text-moss">Assignments</h2>
              {assignments.length === 0 && (
                <p className="ef-muted mt-3 text-sm">No assignments yet.</p>
              )}
              <ul className="mt-4 space-y-4">
                {assignments.map((a) => (
                  <li key={a.id} className="ef-panel !p-4">
                    <p className="font-display text-xl text-ink">{a.title}</p>
                    <p className="ef-muted mt-2 text-sm whitespace-pre-wrap">{a.instructions}</p>
                    <p className="mt-2 text-xs text-ink/50">
                      Max {a.maxPoints} pts
                      {a.mySubmission
                        ? ` · ${a.mySubmission.status}${
                            a.mySubmission.grade != null ? ` · ${a.mySubmission.grade}` : ''
                          }`
                        : ''}
                    </p>
                    {course.enrolled && (
                      <button
                        type="button"
                        className="mt-3 text-sm text-fern hover:underline"
                        onClick={() => setSubmitFor(a.id)}
                      >
                        {a.mySubmission ? 'Resubmit' : 'Submit work'}
                      </button>
                    )}
                    {course.canManage && (
                      <Link
                        href={`/tutor/assignments/${a.id}`}
                        className="ml-3 text-sm text-fern hover:underline"
                      >
                        Grade submissions
                      </Link>
                    )}
                  </li>
                ))}
              </ul>

              {submitFor && (
                <form onSubmit={submitAssignment} className="ef-panel mt-4 space-y-3">
                  <h3 className="font-semibold">Submit assignment</h3>
                  <textarea
                    required
                    minLength={5}
                    rows={4}
                    className="ef-input"
                    value={submitText}
                    onChange={(e) => setSubmitText(e.target.value)}
                    placeholder="Write your answer / lab notes…"
                  />
                  <div className="flex gap-2">
                    <button type="submit" disabled={busy} className="ef-btn">
                      Send
                    </button>
                    <button
                      type="button"
                      className="ef-btn-ghost"
                      onClick={() => setSubmitFor(null)}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </section>

            <section className="mt-10">
              <h2 className="font-display text-2xl text-moss">Reviews</h2>
              {reviews && reviews.count === 0 && (
                <p className="ef-muted mt-3 text-sm">No reviews yet.</p>
              )}
              <ul className="mt-4 space-y-3">
                {(reviews?.reviews || []).map((r) => (
                  <li key={r.id} className="border-t border-line/30 pt-3 first:border-t-0 first:pt-0">
                    <p className="text-sm font-medium">
                      {r.rating}/5 · {r.user.name || 'Student'}
                    </p>
                    {r.comment && <p className="ef-muted mt-1 text-sm">{r.comment}</p>}
                  </li>
                ))}
              </ul>
              {course.enrolled && (
                <form onSubmit={submitReview} className="ef-panel mt-6 space-y-3">
                  <h3 className="font-semibold">Leave a review</h3>
                  <label className="block text-sm">
                    <span className="mb-1 block text-ink/70">Rating</span>
                    <select
                      value={rating}
                      onChange={(e) => setRating(Number(e.target.value))}
                      className="ef-input w-24"
                    >
                      {[5, 4, 3, 2, 1].map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </label>
                  <textarea
                    rows={3}
                    className="ef-input"
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Optional comment"
                  />
                  <button type="submit" disabled={busy} className="ef-btn">
                    Submit review
                  </button>
                </form>
              )}
            </section>
          </>
        )}
      </main>
    </>
  )
}
