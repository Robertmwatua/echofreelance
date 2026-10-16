import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import DocumentHead from '../../../components/DocumentHead'
import { JaasRoom } from '../../../components/JaasRoom'
import { FeedbackCard } from '../../../components/PageFeedback'
import { api, getStoredUser, VirtualClass } from '../../../lib/api'

export default function LiveRoomPage() {
  const router = useRouter()
  const id = typeof router.query.id === 'string' ? router.query.id : ''
  const [session, setSession] = useState<VirtualClass | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [left, setLeft] = useState(false)
  const [completing, setCompleting] = useState(false)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!id) return
    if (!getStoredUser()) { router.replace(`/login?next=${encodeURIComponent(`/classes/${id}/room`)}`); return }
    let active = true
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 20000)
    setLoading(true)
    setError('')
    setSession(null)
    setLeft(false)
    api.enterClass(id, controller.signal).then(data => { if (active) setSession(data) })
      .catch((e: Error) => { if (active) setError(controller.signal.aborted ? 'The classroom server took too long to respond. Please retry.' : e.message) })
      .finally(() => { clearTimeout(timeout); if (active) setLoading(false) })
    return () => { active = false; clearTimeout(timeout); controller.abort() }
  }, [id, attempt, router])

  return <>
    <DocumentHead title={session ? `Live · ${session.title}` : 'Live classroom'} />
    <main className="mx-auto max-w-6xl px-4 py-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div>
        <Link href={id ? `/classes/${id}` : '/classes'} className="ef-link text-sm">← Leave room</Link>
        <h1 className="mt-2 font-display text-2xl sm:text-3xl">{session?.title || 'Live classroom'}</h1>
      </div>{session?.roomUrl && !left && <a href={session.roomUrl} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer" className="ef-btn-ghost">Open 8×8 fallback</a>}</div>
      <p className="ef-meta mb-5">Allow camera and microphone in your browser. If an embedded browser has trouble, open the classroom in Chrome, Edge, Firefox, or Safari. Screen-sharing availability depends on your device. The external 8×8 fallback returns to the provider’s page after hangup; use this built-in room for the class recap.</p>
      {loading && <p className="ef-panel" role="status">Authorizing your classroom access…</p>}
      {error && <FeedbackCard error title="Unable to open the classroom" description={error} retry={() => setAttempt(a => a + 1)} action={{ href: `/classes/${id}`, label: 'Back to class details' }} />}
      {session?.roomUrl && !error && !left && <JaasRoom roomUrl={session.roomUrl} onClose={() => setLeft(true)} />}
      {left && session && <section className="ef-panel mt-6" aria-live="polite"><p className="ef-eyebrow">You’ve left the call</p><h2 className="mt-3 font-display text-3xl">What’s next?</h2><p className="ef-muted mt-4">Review class notes and recordings, or return to your course. Leaving a call doesn’t mark the class completed.</p><div className="mt-6 flex flex-wrap gap-3"><Link className="ef-btn" href={`/classes/${id}#class-notes`}>Class notes & recap</Link><Link className="ef-btn-ghost" href={`/courses/${session.course?.id || ''}`}>Back to course</Link><button className="ef-btn-ghost" onClick={() => setAttempt(a => a + 1)}>Rejoin class</button>{session.canManage && <button disabled={completing} className="ef-btn-ghost" onClick={async () => { setCompleting(true); try { await api.updateClass(id, { status: 'Completed' }); router.push(`/classes/${id}`) } catch (e) { setError(e instanceof Error ? e.message : 'Could not complete class') } finally { setCompleting(false) } }}>Mark class completed</button>}</div></section>}
    </main>
  </>
}
