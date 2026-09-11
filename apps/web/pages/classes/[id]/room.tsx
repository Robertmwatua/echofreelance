import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useMemo, useState } from 'react'
import DocumentHead from '../../../components/DocumentHead'
import { api, getStoredUser, VirtualClass } from '../../../lib/api'

export default function LiveRoomPage() {
  const router = useRouter()
  const id = typeof router.query.id === 'string' ? router.query.id : ''
  const [session, setSession] = useState<VirtualClass | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    if (!getStoredUser()) {
      router.replace(`/login?next=/classes/${id}/room`)
      return
    }
    api
      .enterClass(id)
      .then(setSession)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [id, router])

  const embedUrl = useMemo(() => {
    return session?.roomUrl || ''
  }, [session])

  return (
    <>
      <DocumentHead title={session ? `Live · ${session.title}` : 'Live classroom'} />
      <main className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link href={id ? `/classes/${id}` : '/classes'} className="text-sm text-fern hover:underline">
              ← Leave room
            </Link>
            <h1 className="mt-1 font-display text-2xl text-moss sm:text-3xl">
              {session?.title || 'Live classroom'}
            </h1>
            {session && (
              <p className="text-sm text-ink/65">
                {session.status} · secure in-browser classroom
              </p>
            )}
          </div>
          {embedUrl && (
            <a href={embedUrl} target="_blank" rel="noreferrer" className="ef-btn-ghost">
              Open in new tab
            </a>
          )}
        </div>

        {loading && <p className="ef-muted">Starting classroom…</p>}
        {error && (
          <div className="ef-panel border-red-500/30">
            <p className="text-red-400">{error}</p>
            <p className="mt-2 text-sm text-ink/65">
              Enroll in the course, register for the session, then enter again.
            </p>
          </div>
        )}

        {embedUrl && !error && (
          <div className="overflow-hidden rounded-2xl border border-line/40 bg-black shadow-glow">
            <iframe
              title="EchoFreelance Tech School live classroom"
              src={embedUrl}
              allow="camera; microphone; fullscreen; display-capture; autoplay"
              className="h-[min(78vh,820px)] w-full border-0"
            />
          </div>
        )}
      </main>
    </>
  )
}
