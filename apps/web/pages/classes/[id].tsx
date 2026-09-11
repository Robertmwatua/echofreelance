import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import DocumentHead from '../../components/DocumentHead'
import {
  api,
  ClassRoster,
  classStatusLabel,
  formatWhen,
  getStoredUser,
  googleCalendarUrl,
  VirtualClass,
} from '../../lib/api'

function StatusPill({ status }: { status: string }) {
  if (status === 'Live') {
    return (
      <span className="ef-pill-live">
        <span className="ef-pulse-dot" aria-hidden />
        {classStatusLabel(status)}
      </span>
    )
  }
  if (status === 'Completed') {
    return <span className="ef-pill-done">{classStatusLabel(status)}</span>
  }
  return <span className="ef-pill-scheduled">{classStatusLabel(status)}</span>
}

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

  async function markCompleted() {
    setBusy(true)
    setError('')
    setMessage('')
    try {
      await api.updateClass(id, { status: 'Completed' })
      await load()
      setMessage('Session marked completed.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not update status')
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
          <div className="ef-panel ef-rise mt-6 !p-0 overflow-hidden">
            <div
              className="border-b border-line/25 px-6 py-6 sm:px-8"
              style={{
                background:
                  'linear-gradient(135deg, rgba(45,212,191,0.12), transparent 55%), linear-gradient(225deg, rgba(125,211,252,0.08), transparent 40%)',
              }}
            >
              <div className="flex flex-wrap items-center gap-2">
                <StatusPill status={item.status} />
                <span className="text-xs text-ink/50">
                  {formatWhen(item.startsAt)} – {formatWhen(item.endsAt)}
                </span>
              </div>
              <h1 className="mt-3 font-display text-4xl text-moss">{item.title}</h1>
              {item.description && <p className="ef-muted mt-3 text-lg">{item.description}</p>}
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
                {typeof item.attendanceCount === 'number'
                  ? ` · ${item.attendanceCount} registered`
                  : ''}
              </p>
            </div>

            <div className="px-6 py-6 sm:px-8">
              <div className="flex flex-wrap gap-3">
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
                <a
                  href={googleCalendarUrl({
                    title: item.title,
                    details:
                      item.description ||
                      `Live class · ${item.course?.title || 'EchoFreelance Tech School'}`,
                    startsAt: item.startsAt,
                    endsAt: item.endsAt,
                    location: 'EchoFreelance Tech School · in-browser classroom',
                  })}
                  target="_blank"
                  rel="noreferrer"
                  className="ef-btn-ghost"
                >
                  Add to Google Calendar
                </a>
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
                {item.canManage && item.status !== 'Completed' && item.status !== 'Cancelled' && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={markCompleted}
                    className="ef-btn-ghost"
                  >
                    Mark completed
                  </button>
                )}
              </div>
              {message && <p className="mt-4 text-moss">{message}</p>}
              {error && item && <p className="mt-4 text-red-400">{error}</p>}

              {item.canManage && (
                <div className="mt-8 border-t border-line/30 pt-6">
                  <h2 className="font-display text-xl text-moss">Recording library</h2>
                  <p className="mt-1 text-sm text-ink/55">
                    Paste a replay link after the session (YouTube, Drive, Loom…). Students see it
                    here and on the course page.
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
                  <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <h2 className="font-display text-xl text-moss">Attendance roster</h2>
                      <p className="mt-1 text-sm text-ink/55">
                        {roster.entered}/{roster.registered} entered the room
                      </p>
                    </div>
                    <div className="h-2 w-40 overflow-hidden rounded-full bg-mist/80">
                      <div
                        className="h-full rounded-full bg-moss transition-all"
                        style={{
                          width: `${
                            roster.registered
                              ? Math.round((roster.entered / roster.registered) * 100)
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                  <ul className="mt-4 divide-y divide-line/20">
                    {roster.attendees.map((a) => (
                      <li
                        key={a.id}
                        className="flex items-center justify-between gap-3 py-3 text-sm"
                      >
                        <div>
                          <p className="font-medium">{a.name || a.email}</p>
                          {a.name && <p className="text-xs text-ink/45">{a.email}</p>}
                        </div>
                        <span
                          className={
                            a.attended
                              ? 'ef-pill-live !normal-case tracking-normal'
                              : 'ef-pill-done !normal-case tracking-normal'
                          }
                        >
                          {a.attended ? 'Present' : 'Registered'}
                        </span>
                      </li>
                    ))}
                    {roster.attendees.length === 0 && (
                      <li className="py-3 text-sm text-ink/50">No registrations yet.</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </>
  )
}
