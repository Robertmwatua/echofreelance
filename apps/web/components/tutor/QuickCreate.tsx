import { FormEvent, useState } from 'react'
import { useRouter } from 'next/router'
import { api, CATEGORIES } from '../../lib/api'
import { StudioDialog } from './StudioDialog'

export function QuickCreate({ close, categories }: { close: () => void; categories: string[] }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    setBusy(true); setError('')
    try {
      const course = await api.createCourse({ title: String(form.get('title')).trim(), description: String(form.get('description')).trim(), category: String(form.get('category')).trim() || 'General', level: String(form.get('level')), priceCents: Number(form.get('price')), published: false })
      await router.push(`/tutor/courses/${course.id}#lessons`)
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not create course'); setBusy(false) }
  }
  return <StudioDialog title="New course" drawer close={close} busy={busy}>
    <p className="ef-muted mt-2">Start with the basics. Your course stays a draft until you publish it.</p>
    <form onSubmit={submit} className="mt-6 space-y-5">
      <label className="studio-field">Course title<input autoFocus required minLength={3} maxLength={200} name="title" className="ef-input" placeholder="e.g. Cloud Collaboration Tools" /></label>
      <label className="studio-field">Description<textarea name="description" required minLength={10} className="ef-input" rows={4} placeholder="What will students learn?" /></label>
      <label className="studio-field">Program<input name="category" required defaultValue="General" list="studio-programs" className="ef-input" /><datalist id="studio-programs">{Array.from(new Set([...CATEGORIES, ...categories])).map(c => <option key={c}>{c}</option>)}</datalist></label>
      <label className="studio-field">Level<select name="level" className="ef-input"><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select></label>
      <label className="studio-field">Price (USD cents)<input name="price" type="number" required min={0} step={1} defaultValue={0} className="ef-input" /><span className="ef-muted font-normal">100 cents = $1.00. Enter 0 only if this course is free.</span></label>
      {error && <p role="alert" className="studio-error">{error}</p>}
      <button className="studio-primary w-full" disabled={busy}>{busy ? 'Creating…' : 'Create and add lessons →'}</button>
    </form>
  </StudioDialog>
}
