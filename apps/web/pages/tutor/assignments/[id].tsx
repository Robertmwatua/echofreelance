import Link from 'next/link'
import { useRouter } from 'next/router'
import { FormEvent, useEffect, useState } from 'react'
import DocumentHead from '../../../components/DocumentHead'
import { RequireRole } from '../../../components/RequireRole'
import { api } from '../../../lib/api'

type SubRow = {
  id: string
  content: string
  status: string
  grade?: number | null
  feedback?: string | null
  user: { id: string; name?: string | null; email: string }
}

export default function GradeAssignmentPage() {
  return (
    <RequireRole roles={['Tutor', 'Admin']}>
      {() => <GradePanel />}
    </RequireRole>
  )
}

function GradePanel() {
  const router = useRouter()
  const id = typeof router.query.id === 'string' ? router.query.id : ''
  const [rows, setRows] = useState<SubRow[]>([])
  const [error, setError] = useState('')
  const [grades, setGrades] = useState<Record<string, string>>({})
  const [feedback, setFeedback] = useState<Record<string, string>>({})

  async function load() {
    if (!id) return
    const data = (await api.assignmentSubmissions(id)) as SubRow[]
    setRows(data)
  }

  useEffect(() => {
    load().catch((e: Error) => setError(e.message))
  }, [id])

  async function gradeOne(e: FormEvent, submissionId: string) {
    e.preventDefault()
    const grade = Number(grades[submissionId])
    try {
      await api.gradeSubmission(submissionId, {
        grade,
        feedback: feedback[submissionId] || undefined,
      })
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Grade failed')
    }
  }

  return (
    <>
      <DocumentHead title="Grade submissions — Tutor" />
      <main className="mx-auto max-w-3xl px-5 py-12">
        <Link href="/tutor" className="text-sm text-fern hover:underline">
          ← Tutor desk
        </Link>
        <h1 className="mt-4 font-display text-4xl text-moss">Submissions</h1>
        {error && <p className="mt-4 text-red-400">{error}</p>}
        <ul className="mt-8 space-y-4">
          {rows.map((row) => (
            <li key={row.id} className="ef-panel">
              <p className="font-medium">{row.user.name || row.user.email}</p>
              <p className="ef-muted mt-2 whitespace-pre-wrap text-sm">{row.content}</p>
              <p className="mt-2 text-xs text-ink/50">
                {row.status}
                {row.grade != null ? ` · ${row.grade}` : ''}
              </p>
              <form onSubmit={(e) => gradeOne(e, row.id)} className="mt-4 grid gap-2 sm:grid-cols-[100px_1fr_auto]">
                <input
                  type="number"
                  min={0}
                  required
                  className="ef-input"
                  placeholder="Grade"
                  value={grades[row.id] ?? ''}
                  onChange={(e) => setGrades((g) => ({ ...g, [row.id]: e.target.value }))}
                />
                <input
                  className="ef-input"
                  placeholder="Feedback"
                  value={feedback[row.id] ?? ''}
                  onChange={(e) => setFeedback((f) => ({ ...f, [row.id]: e.target.value }))}
                />
                <button type="submit" className="ef-btn">
                  Grade
                </button>
              </form>
            </li>
          ))}
          {rows.length === 0 && <p className="ef-muted">No submissions yet.</p>}
        </ul>
      </main>
    </>
  )
}
