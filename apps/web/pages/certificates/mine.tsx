import { CardSkeletons, FeedbackCard, PageHero } from '../../components/PageFeedback'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import DocumentHead from '../../components/DocumentHead'
import { RequireRole } from '../../components/RequireRole'
import { api, Certificate } from '../../lib/api'

export default function MyCertificatesPage() {
  return (
    <RequireRole roles={['Student', 'Tutor', 'Admin']}>
      {() => <MyCerts />}
    </RequireRole>
  )
}

function MyCerts() {
  const [certs, setCerts] = useState<Certificate[]>([])
  const [loading, setLoading] = useState(true)
  const [attempt, setAttempt] = useState(0)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    api
      .myCertificates()
      .then(data => { if (active) setCerts(data) })
      .catch((e: Error) => { if (active) setError(e.message) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [attempt])

  return (
    <>
      <DocumentHead title="My certificates — EchoFreelance Tech School" />
      <main className="mx-auto max-w-6xl px-6 py-12">
        <PageHero eyebrow="Progress worth keeping" title="Certificates" description="A record of the skills you’ve built and the courses you’ve completed." />
        {loading && <CardSkeletons label="Loading certificates" />}
        {error && <FeedbackCard error title="Unable to load certificates" description="We couldn’t connect right now. Please check your connection and try again." retry={() => setAttempt(a => a + 1)} />}
        {certs.length === 0 && !loading && !error && (
          <FeedbackCard title="Your next milestone is ahead" description="Complete every lesson in a course to earn your certificate." action={{ href: '/courses', label: 'Explore courses' }} />
        )}
        {!loading && !error && <ul className="mt-8 grid gap-6 md:grid-cols-2">
          {certs.map((c) => (
            <li key={c.id} className="ef-panel !p-4">
              <p className="font-display text-xl text-ink">{c.course.title}</p>
              <p className="mt-1 text-sm ef-muted">
                {c.course.category || 'Course'} · Issued{' '}
                {new Date(c.issuedAt).toLocaleDateString()}
              </p>
              <p className="mt-2 font-mono text-xs text-fern">{c.code}</p>
              <Link
                href={`/certificates/${c.code}`}
                className="mt-3 inline-block text-sm text-fern hover:underline"
              >
                View certificate →
              </Link>
            </li>
          ))}
        </ul>}
      </main>
    </>
  )
}
