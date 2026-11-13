import { CardSkeletons, FeedbackCard, PageHero } from '../../components/PageFeedback'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import { CourseCard } from '../../components/CourseCard'
import DocumentHead from '../../components/DocumentHead'
import { api, CATEGORIES, Course } from '../../lib/api'

export default function CoursesPage() {
  const router = useRouter()
  const [courses, setCourses] = useState<Course[]>([])
  const [category, setCategory] = useState('')
  const [q, setQ] = useState('')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('default')

  /* the hero search and the suggestion chips route here with query params */
  useEffect(() => {
    if (!router.isReady) return
    const qp = typeof router.query.q === 'string' ? router.query.q : ''
    const cp = typeof router.query.category === 'string' ? router.query.category : ''
    setQ(qp)
    setSearch(qp)
    setCategory(cp)
  }, [router.isReady, router.query.q, router.query.category])

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

  const displayed = useMemo(() => {
    const result = [...courses]
    if (sort === 'price') result.sort((a, b) => a.priceCents - b.priceCents)
    if (sort === 'rating') result.sort((a, b) => (b.avgRating ?? -1) - (a.avgRating ?? -1))
    return result
  }, [courses, sort])

  function resetFilters() {
    setQ('')
    setSearch('')
    setCategory('')
    setSort('default')
    void router.replace('/courses', undefined, { shallow: true })
  }

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

        <div className="ef-path-banner mt-6">
          <span className="ef-eyebrow shrink-0">Study help</span>
          <p className="min-w-0 flex-1 text-sm">
            <b className="font-semibold text-ink">Not sure where to start?</b>{' '}
            <span className="ef-muted">Tell the study assistant what you want to do and it will point you at a track.</span>
          </p>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('ef:ask-tutor', { detail: { q: 'Where should I start?' } }))}
            className="ef-btn-ghost !min-h-0 shrink-0 !px-4 !py-2 text-xs"
          >
            Ask the assistant
          </button>
        </div>

        <div className="ef-filter-bar mt-6">
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

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <p className="ef-meta" role="status">{loading ? 'Finding courses…' : error ? 'Catalogue unavailable' : `${courses.length} course${courses.length === 1 ? '' : 's'}${search ? ` matching “${search}”` : ''}`}</p>
          <div className="flex flex-wrap items-center gap-3">
            {(search || category) && <button type="button" onClick={resetFilters} className="ef-link min-h-[44px] text-sm">Clear filters</button>}
            <label className="flex items-center gap-2 text-sm"><span className="ef-muted">Sort</span><select value={sort} onChange={e => setSort(e.target.value)} className="ef-input !w-auto !py-2 text-sm"><option value="default">Default order</option><option value="price">Price: low to high</option><option value="rating">Highest rated</option></select></label>
          </div>
        </div>
        {loading && <CardSkeletons label="Loading courses" />}
        {error && <FeedbackCard error title="Unable to load courses" description="Your next course is still here. We just couldn’t reach the catalog. Check your connection and try again." retry={() => setAttempt(a => a + 1)} />}
        {!loading && !error && courses.length === 0 && (
          <FeedbackCard title="No courses match just yet" description="Try another search or choose a different category to find your next course." />
        )}

        {!loading && !error && <ul className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {displayed.map(course => <li key={course.id}><CourseCard course={course} /></li>)}
        </ul>}
        </div>
      </main>
    </>
  )
}
