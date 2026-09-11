import Link from 'next/link'
import { useRouter } from 'next/router'
import { FormEvent, useState } from 'react'
import DocumentHead from '../../../components/DocumentHead'
import { RequireRole } from '../../../components/RequireRole'
import { api, CATEGORIES } from '../../../lib/api'

export default function NewCoursePage() {
  return (
    <RequireRole roles={['Tutor', 'Admin']}>
      {() => <NewCourseForm />}
    </RequireRole>
  )
}

function NewCourseForm() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<string>(CATEGORIES[0])
  const [level, setLevel] = useState('Beginner')
  const [priceCents, setPriceCents] = useState(0)
  const [published, setPublished] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const course = await api.createCourse({
        title,
        description,
        category,
        level,
        priceCents,
        published,
      })
      router.push(`/tutor/courses/${course.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create course')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <DocumentHead title="New course — Tutor" />
      <main className="relative mx-auto max-w-2xl px-5 py-12">
        <div
          className="pointer-events-none absolute inset-x-0 -top-8 h-48 opacity-30"
          style={{
            background:
              'radial-gradient(ellipse 70% 80% at 20% 0%, rgba(45,212,191,0.25), transparent)',
          }}
          aria-hidden
        />
        <div className="relative">
          <Link href="/tutor" className="ef-link text-sm">
            ← Tutor desk
          </Link>
          <h1 className="mt-4 font-display text-4xl text-moss sm:text-5xl">Create a course</h1>
          <p className="ef-muted mt-2 text-sm">
            Set the basics now — add lessons, assignments, and live classes after.
          </p>

          <form onSubmit={onSubmit} className="ef-panel mt-8 space-y-5">
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-ink/85">Title</span>
              <input
                required
                minLength={3}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="ef-input"
                placeholder="e.g. Intro to Web Security"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-ink/85">Description</span>
              <textarea
                required
                minLength={10}
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="ef-input"
                placeholder="What will students learn?"
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="mb-1.5 block font-medium text-ink/85">Category</span>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="ef-input"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                <span className="mb-1.5 block font-medium text-ink/85">Level</span>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  className="ef-input"
                >
                  <option>Beginner</option>
                  <option>Intermediate</option>
                  <option>Advanced</option>
                </select>
              </label>
            </div>
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-ink/85">Price (cents)</span>
              <input
                type="number"
                min={0}
                value={priceCents}
                onChange={(e) => setPriceCents(Number(e.target.value))}
                className="ef-input"
              />
              <span className="mt-1 block text-xs text-ink/45">0 = free</span>
            </label>
            <label className="flex items-center gap-2.5 text-sm text-ink/85">
              <input
                type="checkbox"
                checked={published}
                onChange={(e) => setPublished(e.target.checked)}
                className="h-4 w-4 rounded border-line accent-moss"
              />
              Publish to catalog immediately
            </label>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button type="submit" disabled={busy} className="ef-btn w-full sm:w-auto">
              {busy ? 'Saving…' : 'Create course'}
            </button>
          </form>
        </div>
      </main>
    </>
  )
}
