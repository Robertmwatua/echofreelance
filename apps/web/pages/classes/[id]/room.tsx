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
      </div>{session?.roomUrl && <a href={session.roomUrl} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer" className="ef-btn-ghost">Open in new tab</a>}</div>
      <p className="ef-meta mb-5">Allow camera and microphone in your browser. If an embedded browser has trouble, open the classroom in Chrome, Edge, Firefox, or Safari. Screen-sharing availability depends on your device.</p>
      {loading && <p className="ef-panel" role="status">Authorizing your classroom access…</p>}
      {error && <FeedbackCard error title="Unable to open the classroom" description={error} retry={() => setAttempt(a => a + 1)} action={{ href: `/classes/${id}`, label: 'Back to class details' }} />}
      {session?.roomUrl && !error && <JaasRoom roomUrl={session.roomUrl} onClose={() => { router.push(`/classes/${id}`) }} />}
    </main>
  </>
}
