import { CardSkeletons, FeedbackCard, PageHero } from '../../components/PageFeedback'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import DocumentHead from '../../components/DocumentHead'
import { RequireRole } from '../../components/RequireRole'
import { api, LessonNoteRow } from '../../lib/api'

export default function NotesPage() {
  return (
    <RequireRole roles={['Student', 'Tutor', 'Admin']}>
      {() => <NotesHome />}
    </RequireRole>
  )
}

function NotesHome() {
  const [notes, setNotes] = useState<LessonNoteRow[]>([])
  const [loading, setLoading] = useState(true)
  const [attempt, setAttempt] = useState(0)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    api
      .myNotes()
      .then(data => { if (active) setNotes(data) })
      .catch((e: Error) => { if (active) setError(e.message) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [attempt])

  return (
    <>
      <DocumentHead title="My notes — EchoFreelance Tech School" />
      <main className="mx-auto max-w-6xl px-6 py-12">
        <PageHero eyebrow="Your study companion" title="My notes" description="Your ideas, discoveries, and useful details, collected in one quiet place." />
        {loading && <CardSkeletons label="Loading my notes" />}
        {error && <FeedbackCard error title="Unable to load my notes" description="We couldn’t connect right now. Please check your connection and try again." retry={() => setAttempt(a => a + 1)} />}
        {notes.length === 0 && !loading && !error && (
          <FeedbackCard title="Your first note starts with a lesson" description="Open a course and save a private note as you learn." action={{ href: '/courses', label: 'Explore courses' }} />
        )}
        {!loading && !error && <ul className="mt-8 grid gap-6 md:grid-cols-2">
          {notes.map((n) => (
            <li key={n.id} className="ef-panel !p-4">
              <p className="text-xs uppercase tracking-wide text-fern">
                {n.lesson?.course.title}
              </p>
              <Link
                href={`/courses/${n.lesson?.courseId}`}
                className="mt-1 block font-display text-xl hover:text-moss"
              >
                {n.lesson?.title}
              </Link>
              <p className="ef-muted mt-2 whitespace-pre-wrap text-sm">{n.body.slice(0, 280)}</p>
              <p className="mt-2 text-xs ef-muted">
                Updated {new Date(n.updatedAt).toLocaleString()}
              </p>
            </li>
          ))}
        </ul>}
      </main>
    </>
  )
}
