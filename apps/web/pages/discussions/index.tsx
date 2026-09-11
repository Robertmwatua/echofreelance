import Link from 'next/link'
import { useEffect, useState } from 'react'
import DocumentHead from '../components/DocumentHead'
import { RequireRole } from '../components/RequireRole'
import { api, Course, DiscussionPost } from '../lib/api'

export default function DiscussionsPage() {
  return (
    <RequireRole roles={['Student', 'Tutor', 'Admin']}>
      {() => <DiscussionsHome />}
    </RequireRole>
  )
}

function DiscussionsHome() {
  const [courses, setCourses] = useState<Course[]>([])
  const [previews, setPreviews] = useState<Record<string, DiscussionPost[]>>({})
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .myCourses()
      .then(async (list) => {
        setCourses(list)
        const entries = await Promise.all(
          list.slice(0, 8).map(async (c) => {
            const posts = await api.courseDiscussions(c.id).catch(() => [])
            return [c.id, posts.slice(0, 2)] as const
          }),
        )
        setPreviews(Object.fromEntries(entries))
      })
      .catch((e: Error) => setError(e.message))
  }, [])

  return (
    <>
      <DocumentHead title="Discussions — EchoFreelance" />
      <main className="mx-auto max-w-3xl px-5 py-12">
        <h1 className="font-display text-4xl text-moss">Discussions</h1>
        <p className="ef-muted mt-2">
          Course threads for questions, ideas, and peer help.
        </p>
        {error && <p className="mt-6 text-red-400">{error}</p>}
        {courses.length === 0 && !error && (
          <div className="ef-panel mt-8">
            <p>Enroll in a course to join its discussion.</p>
            <Link href="/courses" className="ef-link mt-2 inline-block text-sm">
              Browse catalog →
            </Link>
          </div>
        )}
        <ul className="mt-8 space-y-6">
          {courses.map((c) => (
            <li key={c.id} className="ef-panel !p-4">
              <Link href={`/courses/${c.id}#discussion`} className="font-display text-xl hover:text-moss">
                {c.title}
              </Link>
              <p className="mt-1 text-xs uppercase tracking-wide text-fern">{c.category}</p>
              {(previews[c.id] || []).length === 0 ? (
                <p className="ef-muted mt-3 text-sm">No posts yet — start the conversation on the course page.</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {previews[c.id].map((p) => (
                    <li key={p.id} className="text-sm text-ink/75">
                      <span className="font-medium text-ink">{p.author.name || 'Member'}:</span>{' '}
                      {p.body.slice(0, 120)}
                      {p.body.length > 120 ? '…' : ''}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </main>
    </>
  )
}
