import {Field} from '../../../components/forms/Fields'
import {Button} from '../../../components/Button'
import { FeedbackCard } from '../../../components/PageFeedback'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { FormEvent, useEffect, useState } from 'react'
import DocumentHead from '../../../components/DocumentHead'
import { RequireRole } from '../../../components/RequireRole'
import { api } from '../../../lib/api'

type SubRow = {
  id: string
  linkUrl?:string|null
  assignment:{title:string;maxPoints:number;courseId:string}
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
  const [loading,setLoading]=useState(true),[busy,setBusy]=useState(''),[message,setMessage]=useState('')
  const [grades, setGrades] = useState<Record<string, string>>({})
  const [feedback, setFeedback] = useState<Record<string, string>>({})

  async function load() {
    if (!id) return
    const data = (await api.assignmentSubmissions(id)) as SubRow[]
    setRows(data)
    setGrades(Object.fromEntries(data.map(r=>[r.id,r.grade==null?'':String(r.grade)])))
    setFeedback(Object.fromEntries(data.map(r=>[r.id,r.feedback||''])))
    setLoading(false)
  }

  useEffect(() => {
    load().catch((e: Error) => {setError(e.message);setLoading(false)})
  }, [id])

  async function gradeOne(e: FormEvent, submissionId: string) {
    e.preventDefault()
    const grade = Number(grades[submissionId])
    setBusy(submissionId);setError('');setMessage('')
    try {
      await api.gradeSubmission(submissionId, {
        grade,
        feedback: feedback[submissionId] || undefined,
      })
      await load()
      setMessage('Grade and feedback saved. The student has been notified.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Grade failed')
    }finally{setBusy('')}
  }

  return (
    <>
      <DocumentHead title="Grade submissions — Tutor" />
      <main className="mx-auto max-w-5xl px-6 py-12">
        <Link href="/tutor" className="text-sm text-fern hover:underline">
          ← Tutor desk
        </Link>
        <p className="ef-page-label">Workshop / assignment review</p><h1 className="mt-4   text-ink ef-staff-title">Review student work.</h1>
        {error && <p className="mt-4 ef-text-danger ef-toast">{error}</p>}
        {message&&<p role="status" className="ef-toast mt-4">{message}</p>}{loading&&<p role="status" className="ef-panel mt-4">Loading submissions…</p>}
        {!loading && !rows.length && !error && <FeedbackCard title="No submissions to review yet." description="Student work will appear here when it is submitted." action={{href:'/tutor',label:'Back to your courses'}}/>}<ul className="mt-8 space-y-4">
          {rows.map((row) => (
            <li key={row.id} className="ef-panel learning-review-card">
              <p className="ef-meta mb-3">{row.assignment.title} · {row.assignment.maxPoints} points</p><p className="font-medium">{row.user.name || row.user.email}</p>
              <p className="ef-muted mt-2 whitespace-pre-wrap text-sm">{row.content}</p>
              {row.linkUrl&&<a href={row.linkUrl} target="_blank" rel="noopener noreferrer" className="ef-navigation-link mt-3">Open submitted project ↗</a>}<p className="mt-2 text-xs ef-muted">
                {row.status}
                {row.grade != null ? ` · ${row.grade}` : ''}
              </p>
              <form onSubmit={(e) => gradeOne(e, row.id)} className="ef-field-stack mt-5">
                <Field label={`Grade / out of ${row.assignment.maxPoints}`}><input
                  type="number"
                  min={0}
                  max={row.assignment.maxPoints}
                  aria-label={`Grade for ${row.user.name||row.user.email}`}
                  required
                  className="ef-input"
                  placeholder="Grade"
                  value={grades[row.id] ?? ''}
                  onChange={(e) => setGrades((g) => ({ ...g, [row.id]: e.target.value }))}
                /></Field>
                <Field label="Feedback to the student"><textarea rows={3} maxLength={5000}
                  className="ef-input"
                  placeholder="Feedback"
                  aria-label={`Feedback for ${row.user.name||row.user.email}`}
                  value={feedback[row.id] ?? ''}
                  onChange={(e) => setFeedback((f) => ({ ...f, [row.id]: e.target.value }))}
                /></Field>
                <Button type="submit" className="ef-btn" loading={busy===row.id} disabled={!!busy} loadingLabel="Saving…">
                  Save feedback
                </Button>
              </form>
            </li>
          ))}

        </ul>
      </main>
    </>
  )
}
