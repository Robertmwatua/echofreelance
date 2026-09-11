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
      <main className="mx-auto max-w-2xl px-5 py-12">
        <Link href="/tutor" className="text-sm text-fern hover:underline">
          ← Tutor desk
        </Link>
        <h1 className="mt-4 font-display text-4xl text-moss">Create a course</h1>
        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Title</span>
            <input
              required
              minLength={3}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-md border border-moss/20 bg-white/70 px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Description</span>
            <textarea
              required
              minLength={10}
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-md border border-moss/20 bg-white/70 px-3 py-2"
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Category</span>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-md border border-moss/20 bg-white/70 px-3 py-2"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Level</span>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="w-full rounded-md border border-moss/20 bg-white/70 px-3 py-2"
              >
                <option>Beginner</option>
                <option>Intermediate</option>
                <option>Advanced</option>
              </select>
            </label>
          </div>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Price (cents)</span>
            <input
              type="number"
              min={0}
              value={priceCents}
              onChange={(e) => setPriceCents(Number(e.target.value))}
              className="w-full rounded-md border border-moss/20 bg-white/70 px-3 py-2"
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={published}
              onChange={(e) => setPublished(e.target.checked)}
            />
            Publish to catalog immediately
          </label>
          {error && <p className="text-sm text-red-700">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="rounded-md bg-moss px-5 py-3 text-sm font-semibold text-sand hover:bg-fern disabled:opacity-60"
          >
            {busy ? 'Saving…' : 'Create course'}
          </button>
        </form>
      </main>
    </>
  )
}
