import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import DocumentHead from '../../components/DocumentHead'
import {
  api,
  ClassRoster,
  formatWhen,
  getStoredUser,
  VirtualClass,
} from '../../lib/api'

export default function ClassDetailPage() {
  const router = useRouter()
  const id = typeof router.query.id === 'string' ? router.query.id : ''
  const [item, setItem] = useState<VirtualClass | null>(null)
  const [roster, setRoster] = useState<ClassRoster | null>(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [recordingUrl, setRecordingUrl] = useState('')

  async function load() {
    if (!id) return
    const data = await api.class(id)
    setItem(data)
    setRecordingUrl(data.recordingUrl || '')
    if (data.canManage) {
      try {
        setRoster(await api.classRoster(id))
      } catch {
        setRoster(null)
      }
    }
  }

  useEffect(() => {
    if (!id) return
    load().catch((e: Error) => setError(e.message))
  }, [id])

  async function register() {
    if (!getStoredUser()) {
      router.push(`/login?next=/classes/${id}`)
      return
    }
    setBusy(true)
    setError('')
    setMessage('')
    try {
      await api.registerClass(id)
      await load()
      setMessage('Registered — you can enter the live classroom.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not register')
    } finally {
      setBusy(false)
    }
  }

  async function saveRecording() {
    setBusy(true)
    setError('')
    setMessage('')
    try {
      await api.updateClass(id, { recordingUrl: recordingUrl.trim() })
      await load()
      setMessage('Recording link saved.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save recording')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <DocumentHead title={item ? `${item.title} — Live class` : 'Live class'} />
      <main className="mx-auto max-w-3xl px-5 py-12">
        <Link href="/classes" className="text-sm text-fern hover:underline">
          ← Schedule
        </Link>
        {error && !item && <p className="mt-8 text-red-400">{error}</p>}
        {item && (
          <div className="ef-panel mt-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-fern">
              {item.status} · {formatWhen(item.startsAt)} – {formatWhen(item.endsAt)}
            </p>
            <h1 className="mt-2 font-display text-4xl text-moss">{item.title}</h1>
            {item.description && <p className="ef-muted mt-4 text-lg">{item.description}</p>}
            <p className="mt-4 text-sm text-ink/60">
              Course:{' '}
              {item.course ? (
                <Link href={`/courses/${item.course.id}`} className="text-fern hover:underline">
                  {item.course.title}
                </Link>
              ) : (
                '—'
              )}
              {item.host?.name ? ` · Host: ${item.host.name}` : ''}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              {!item.registered && !item.canManage && (
                <button type="button" disabled={busy} onClick={register} className="ef-btn">
                  {busy ? 'Registering…' : 'Register for session'}
                </button>
              )}
              {(item.canEnterRoom || item.registered || item.canManage) && (
                <Link href={`/classes/${item.id}/room`} className="ef-btn">
                  Enter live classroom
                </Link>
              )}
              {item.recordingUrl && (
                <a
                  href={item.recordingUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="ef-btn-ghost"
                >
                  Watch recording
                </a>
              )}
            </div>
            {message && <p className="mt-4 text-moss">{message}</p>}
            {error && item && <p className="mt-4 text-red-400">{error}</p>}

            {item.canManage && (
              <div className="mt-8 border-t border-line/30 pt-6">
                <h2 className="font-display text-xl text-moss">Recording</h2>
                <p className="mt-1 text-sm text-ink/55">
                  Paste a replay link after the session (YouTube, Drive, etc.).
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <input
                    type="url"
                    value={recordingUrl}
                    onChange={(e) => setRecordingUrl(e.target.value)}
                    placeholder="https://…"
                    className="ef-input min-w-[16rem] flex-1 text-sm"
                  />
                  <button
                    type="button"
                    disabled={busy}
                    onClick={saveRecording}
                    className="ef-btn-ghost"
                  >
                    Save
                  </button>
                </div>
              </div>
            )}

            {roster && (
              <div className="mt-8 border-t border-line/30 pt-6">
                <h2 className="font-display text-xl text-moss">Attendance</h2>
                <p className="mt-1 text-sm text-ink/55">
                  {roster.entered}/{roster.registered} entered the room
                </p>
                <ul className="mt-4 space-y-2 text-sm">
                  {roster.attendees.map((a) => (
                    <li key={a.id} className="flex justify-between gap-3">
                      <span>{a.name || a.email}</span>
                      <span className={a.attended ? 'text-moss' : 'text-ink/40'}>
                        {a.attended ? 'Entered' : 'Registered'}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </main>
    </>
  )
}
