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
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .myNotes()
      .then(setNotes)
      .catch((e: Error) => setError(e.message))
  }, [])

  return (
    <>
      <DocumentHead title="My notes — EchoFreelance Tech School" />
      <main className="mx-auto max-w-3xl px-5 py-12">
        <h1 className="font-display text-4xl text-moss">My notes</h1>
        <p className="ef-muted mt-2">
          Private study notes attached to lessons. Open a course lesson to write or edit.
        </p>
        {error && <p className="mt-6 text-red-400">{error}</p>}
        {notes.length === 0 && !error && (
          <div className="ef-panel mt-8">
            <p>No notes yet.</p>
            <Link href="/courses" className="ef-link mt-2 inline-block text-sm">
              Open a course →
            </Link>
          </div>
        )}
        <ul className="mt-8 space-y-4">
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
              <p className="mt-2 text-xs text-ink/45">
                Updated {new Date(n.updatedAt).toLocaleString()}
              </p>
            </li>
          ))}
        </ul>
      </main>
    </>
  )
}
