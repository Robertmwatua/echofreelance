import { RoadmapEditor, roadmapLines } from '../../../components/tutor/RoadmapEditor'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { FormEvent, useEffect, useMemo, useState } from 'react'
import DocumentHead from '../../../components/DocumentHead'
import { CategoryField } from '../../../components/CategoryField'
import { RequireRole } from '../../../components/RequireRole'
import { api, CATEGORIES, Course } from '../../../lib/api'

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
  const [roadmap, setRoadmap] = useState('')
  const [publicPreview, setPublicPreview] = useState(false)
  const published = false
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [knownCategories, setKnownCategories] = useState<string[]>([])

  useEffect(() => {
    Promise.all([api.taughtCourses().catch(() => [] as Course[]), api.courses().catch(() => [] as Course[])])
      .then(([taught, catalog]) => {
        const cats = [...taught, ...catalog].map((c) => c.category).filter(Boolean)
        setKnownCategories(Array.from(new Set(cats)))
      })
      .catch(() => {})
  }, [])

  const suggestions = useMemo(
    () => Array.from(new Set([...CATEGORIES, ...knownCategories])),
    [knownCategories],
  )

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const course = await api.createCourse({
        title,
        description,
        category: category.trim() || 'General',
        level,
        roadmapSteps: roadmapLines(roadmap),
        publicPreview,
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
      <main className="relative mx-auto max-w-2xl px-6 py-12">
        <div className="relative">
          <Link href="/tutor" className="ef-link text-sm">
            ← Tutor desk
          </Link>
          <p className="ef-page-label">Workshop / a new course</p><h1 className="mt-4   text-ink  ef-title">Teach what you know.</h1>
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
                <CategoryField
                  value={category}
                  onChange={setCategory}
                  suggestions={suggestions}
                />
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
            <p className="ef-muted text-sm">School fees are set and confirmed by an administrator, in KES.</p>
            <p className="ef-muted text-sm">New courses start as drafts. Add lessons, then publish from your studio.</p>
            {error && <p className="text-sm ef-text-danger ef-toast">{error}</p>}
            <RoadmapEditor value={roadmap} change={setRoadmap} listed={publicPreview} setListed={setPublicPreview}/><button type="submit" disabled={busy} className="ef-btn w-full sm:w-auto">
              {busy ? 'Saving…' : 'Create course'}
            </button>
          </form>
        </div>
      </main>
    </>
  )
}
