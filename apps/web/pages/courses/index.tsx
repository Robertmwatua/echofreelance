import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import DocumentHead from '../../components/DocumentHead'
import { api, CATEGORIES, Course, formatPrice } from '../../lib/api'

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [category, setCategory] = useState('')
  const [q, setQ] = useState('')
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    api
      .courses({
        category: category || undefined,
        q: search || undefined,
      })
      .then(setCourses)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [category, search])

  const cats = useMemo(() => {
    const fromData = Array.from(new Set(courses.map((c) => c.category).filter(Boolean)))
    return Array.from(new Set([...CATEGORIES, ...fromData]))
  }, [courses])

  return (
    <>
      <DocumentHead title="Courses — EchoFreelance" />
      <main className="relative mx-auto max-w-6xl px-5 py-12">
        <div
          className="pointer-events-none absolute inset-x-0 -top-12 h-56 opacity-[0.18]"
          style={{
            backgroundImage:
              'radial-gradient(ellipse 70% 80% at 10% 0%, rgba(45,212,191,0.35), transparent), radial-gradient(ellipse 50% 60% at 90% 10%, rgba(56,189,248,0.25), transparent)',
          }}
          aria-hidden
        />
        <div className="relative">
        <h1 className="font-display text-4xl text-moss sm:text-5xl">Course catalog</h1>
        <p className="mt-2 max-w-xl text-ink/70">
          Cybersecurity, engineering, cloud, and more — taught by campus tutors with live labs.
        </p>

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
            className={`rounded-md px-3 py-1.5 text-sm ${
              !category ? 'bg-moss text-sand' : 'border border-moss/20 hover:bg-mist'
            }`}
          >
            All
          </button>
          {cats.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`rounded-md px-3 py-1.5 text-sm ${
                category === cat ? 'bg-moss text-sand' : 'border border-moss/20 hover:bg-mist'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {loading && <p className="mt-10 text-ink/60">Loading courses…</p>}
        {error && <p className="mt-10 text-red-400">{error}</p>}
        {!loading && !error && courses.length === 0 && (
          <div className="ef-panel mt-10">
            <p className="text-ink/85">No matching courses.</p>
            <p className="mt-2 text-sm text-ink/60">
              Tutors publish programs from the{' '}
              <Link href="/tutor" className="text-fern hover:underline">
                Tutor desk
              </Link>
              .
            </p>
          </div>
        )}

        <ul className="mt-10 space-y-8">
          {courses.map((course) => (
            <li key={course.id} className="border-t border-moss/15 pt-8 first:border-t-0 first:pt-0">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-fern">
                    {course.category} · {course.level} · {formatPrice(course.priceCents)}
                    {course.lessonCount ? ` · ${course.lessonCount} lessons` : ''}
                    {course.avgRating != null
                      ? ` · ${course.avgRating}★ (${course.reviewCount || 0})`
                      : ''}
                  </p>
                  <Link
                    href={`/courses/${course.id}`}
                    className="mt-1 block font-display text-2xl text-ink hover:text-moss"
                  >
                    {course.title}
                  </Link>
                  <p className="mt-2 max-w-2xl text-ink/70">{course.description}</p>
                  {(course.tutor?.name || course.instructor?.name) && (
                    <p className="mt-2 text-sm text-ink/50">
                      Tutor: {course.tutor?.name || course.instructor?.name}
                    </p>
                  )}
                </div>
                <Link
                  href={`/courses/${course.id}`}
                  className="shrink-0 self-start rounded-md bg-moss px-4 py-2 text-sm font-semibold text-sand hover:bg-fern"
                >
                  {course.enrolled ? 'Continue' : 'View'}
                </Link>
              </div>
            </li>
          ))}
        </ul>
        </div>
      </main>
    </>
  )
}
