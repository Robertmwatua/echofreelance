import { CardSkeletons, FeedbackCard, PageHero } from '../../components/PageFeedback'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import DocumentHead from '../../components/DocumentHead'
import { RequireRole } from '../../components/RequireRole'
import { api, Course, DiscussionPost } from '../../lib/api'

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
  const [loading, setLoading] = useState(true)
  const [attempt, setAttempt] = useState(0)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    setError('')
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
      .finally(() => setLoading(false))
  }, [attempt])

  return (
    <>
      <DocumentHead title="Community — EchoFreelance Tech School" />
      <main className="mx-auto max-w-6xl px-6 py-12">
        <PageHero eyebrow="Better together" title="Community" description="Bring your questions, share what you’re building, and learn alongside your classmates." />
        {loading && <CardSkeletons label="Loading community" />}
        {error && <FeedbackCard error title="Unable to load your community" description="We couldn’t reach your course discussions. Try again in a moment." retry={() => setAttempt(a => a + 1)} />}
        {!loading && courses.length === 0 && !error && (
          <FeedbackCard title="Your community starts with a course" description="Enroll in a course to ask questions, exchange ideas, and meet your classmates." action={{ href: '/courses', label: 'Explore courses' }} />
        )}
        {!loading && !error && <ul className="mt-8 space-y-6">
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
                    <li key={p.id} className="text-sm ef-muted">
                      <span className="font-medium text-ink">{p.author.name || 'Member'}:</span>{' '}
                      {p.body.slice(0, 120)}
                      {p.body.length > 120 ? '…' : ''}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>}
      </main>
    </>
  )
}
