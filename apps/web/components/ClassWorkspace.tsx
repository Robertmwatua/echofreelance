import { FormEvent, useEffect, useState } from 'react'
import { api, ClassNote, formatWhen } from '../lib/api'

export function ClassWorkspace({ classId, canManage, canRemind }: { classId: string; canManage: boolean; canRemind: boolean }) {
  const [notes, setNotes] = useState<ClassNote[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [body, setBody] = useState('')
  const [expiry, setExpiry] = useState('24')
  const [customExpiry, setCustomExpiry] = useState('')
  const [remindAt, setRemindAt] = useState('')
  const [savedReminder, setSavedReminder] = useState<{ remindAt: string; deliveredAt: string | null } | null>(null)
  const [busy, setBusy] = useState(false)
  const [refresh, setRefresh] = useState(0)
  useEffect(() => {
    let active = true
    setLoading(true)
    Promise.all([api.classNotes(classId), api.getClassReminder(classId)]).then(([data, reminder]) => { if (active) { setNotes(data); setSavedReminder(reminder); setError('') } }).catch((e: Error) => { if (active) setError(e.message) }).finally(() => { if (active) setLoading(false) })
    const timer = setInterval(() => { if (active) setNotes(current => current.filter(n => !n.expiresAt || new Date(n.expiresAt) > new Date())) }, 30000)
    return () => { active = false; clearInterval(timer) }
  }, [classId, refresh])
  async function act(fn: () => Promise<unknown>, success: string) {
    setBusy(true); setError(''); setMessage('')
    try { await fn(); setMessage(success); setRefresh(r => r + 1) } catch (e) { setError(e instanceof Error ? e.message : 'Could not save changes') } finally { setBusy(false) }
  }
  function save(e: FormEvent) {
    e.preventDefault()
    const date = expiry === 'custom' ? new Date(customExpiry) : expiry === 'never' ? null : new Date(Date.now() + Number(expiry) * 3600000)
    if (date && (!Number.isFinite(date.getTime()) || date <= new Date())) { setError('Choose an expiry in the future.'); return }
    void act(async () => { await api.addClassNote(classId, { body, expiresAt: date?.toISOString() }); setBody('') }, 'Class note shared.')
  }
  return <section id="class-notes" className="mt-8 scroll-mt-28 border-t border-line pt-6">
    <p className="ef-eyebrow">Keep learning after the call</p><h2 className="mt-2 font-display text-2xl">Class notes & reminders</h2><p className="ef-meta mt-3">Tutor notes are shared with enrolled students. Expired notes disappear automatically.</p>
    {error && <div role="alert" className="ef-panel mt-4"><p>{error}</p><button className="ef-btn-ghost mt-3" onClick={() => setRefresh(r => r + 1)}>Retry notes</button></div>}{message && <p role="status" className="mt-4 text-fern">{message}</p>}
    {loading ? <p role="status" className="mt-5 ef-muted">Loading class notes…</p> : <ul className="mt-5 space-y-4">{notes.filter(n => !n.expiresAt || new Date(n.expiresAt) > new Date()).map(note => <li key={note.id} className="ef-panel"><p className="whitespace-pre-wrap break-words text-sm leading-7">{note.body}</p><p className="ef-meta mt-4">{note.author.name || 'Tutor'} · {note.expiresAt ? `Available until ${formatWhen(note.expiresAt)}` : 'No expiry'}</p>{canManage && <button disabled={busy} className="ef-link mt-3 min-h-[44px] text-sm" onClick={() => { if (window.confirm('Delete this shared note?')) void act(() => api.deleteClassNote(classId, note.id), 'Note deleted.') }}>Delete note</button>}</li>)}{!notes.length && !error && <li className="ef-panel ef-muted">No class notes yet. Check back after the session.</li>}</ul>}
    {canManage && <form onSubmit={save} className="ef-panel mt-6 space-y-4"><h3 className="font-semibold">Share a class note</h3><label className="block text-sm">Note<textarea required maxLength={10000} value={body} onChange={e => setBody(e.target.value)} className="ef-input mt-2" placeholder="Summary, resources, or next steps for your students…" /></label><div className="grid gap-4 sm:grid-cols-2"><label className="text-sm">Keep available for<select className="ef-input mt-2" value={expiry} onChange={e => setExpiry(e.target.value)}><option value="24">24 hours</option><option value="48">48 hours</option><option value="168">7 days</option><option value="custom">Custom expiry</option><option value="never">No expiry</option></select></label>{expiry === 'custom' && <label className="text-sm">Expiry (your local time)<input required type="datetime-local" value={customExpiry} onChange={e => setCustomExpiry(e.target.value)} className="ef-input mt-2" /></label>}</div><button disabled={busy} className="ef-btn">Share note</button></form>}
    {canRemind && <form className="ef-panel mt-6 space-y-4" onSubmit={e => { e.preventDefault(); const date = new Date(remindAt); if (!Number.isFinite(date.getTime())) { setError('Choose a reminder time.'); return } void act(() => api.setClassReminder(classId, date.toISOString()), 'Reminder saved. You’ll see it in Alerts when it is due.') }}><h3 className="font-semibold">Remind me about this class</h3>{savedReminder && <p className="text-sm text-fern">{savedReminder.deliveredAt ? 'Delivered' : 'Reminder set'}: {formatWhen(savedReminder.remindAt)}</p>}<p className="ef-meta">In-app Alerts only; delivery runs every minute while the API is running. Choose a future time before the class ends.</p><label className="block text-sm">Reminder (your local time)<input required type="datetime-local" className="ef-input mt-2 sm:max-w-sm" value={remindAt} onChange={e => setRemindAt(e.target.value)} /></label><div className="flex flex-wrap gap-3"><button disabled={busy} className="ef-btn-ghost">Save reminder</button><button type="button" disabled={busy} className="ef-btn-ghost" onClick={() => { void act(() => api.removeClassReminder(classId), 'Reminder removed.') }}>Remove reminder</button></div></form>}
  </section>
}
