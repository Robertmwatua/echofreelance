import { CardSkeletons, FeedbackCard, PageHero } from '../../components/PageFeedback'
import { useEffect, useMemo, useState } from 'react'
import { CourseCard } from '../../components/CourseCard'
import DocumentHead from '../../components/DocumentHead'
import { api, CATEGORIES, Course } from '../../lib/api'

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [category, setCategory] = useState('')
  const [q, setQ] = useState('')
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    api
      .courses({
        category: category || undefined,
        q: search || undefined,
      })
      .then(data => { if (active) setCourses(data) })
      .catch((e: Error) => { if (active) setError(e.message) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [category, search, attempt])

  const cats = useMemo(() => {
    const fromData = Array.from(new Set(courses.map((c) => c.category).filter(Boolean)))
    return Array.from(new Set([...CATEGORIES, ...fromData]))
  }, [courses])

  return (
    <>
      <DocumentHead title="Courses — EchoFreelance Tech School" />
      <main className="relative mx-auto max-w-6xl px-6 py-12">
        <div className="relative">
        <PageHero eyebrow="Find your direction" title="Courses" description="Practical skills, thoughtful guidance, and a clear path forward. Find the course that fits your next chapter." />

        <form
          className="mt-6 flex flex-wrap gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            setSearch(q.trim())
          }}
        >
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Search courses"
            placeholder="Search courses…"
            className="ef-input max-w-md flex-1 text-sm"
          />
          <button type="submit" className="ef-btn">
            Search
          </button>
          {search && (
            <button
              type="button"
              className="ef-btn-ghost"
              onClick={() => {
                setQ('')
                setSearch('')
              }}
            >
              Clear
            </button>
          )}
        </form>

        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCategory('')}
            aria-pressed={!category}
            className="ef-filter"
          >
            All
          </button>
          {cats.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              aria-pressed={category === cat}
              className="ef-filter"
            >
              {cat}
            </button>
          ))}
        </div>

        {loading && <CardSkeletons label="Loading courses" />}
        {error && <FeedbackCard error title="Unable to load courses" description="Your next course is still here. We just couldn’t reach the catalog. Check your connection and try again." retry={() => setAttempt(a => a + 1)} />}
        {!loading && !error && courses.length === 0 && (
          <FeedbackCard title="No courses match just yet" description="Try another search or choose a different category to find your next course." />
        )}

        {!loading && !error && <ul className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {courses.map(course => <li key={course.id}><CourseCard course={course} /></li>)}
        </ul>}
        </div>
      </main>
    </>
  )
}
