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
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .myCertificates()
      .then(setCerts)
      .catch((e: Error) => setError(e.message))
  }, [])

  return (
    <>
      <DocumentHead title="My certificates — EchoFreelance" />
      <main className="mx-auto max-w-3xl px-5 py-12">
        <h1 className="font-display text-4xl text-moss">Certificates</h1>
        <p className="ef-muted mt-2">
          Finish every lesson in a course to earn a verifiable completion certificate.
        </p>
        {error && <p className="mt-6 text-red-400">{error}</p>}
        {certs.length === 0 && !error && (
          <div className="ef-panel mt-8">
            <p className="text-ink/80">No certificates yet.</p>
            <Link href="/courses" className="mt-2 inline-block text-sm text-fern hover:underline">
              Continue learning →
            </Link>
          </div>
        )}
        <ul className="mt-8 space-y-4">
          {certs.map((c) => (
            <li key={c.id} className="ef-panel !p-4">
              <p className="font-display text-xl text-ink">{c.course.title}</p>
              <p className="mt-1 text-sm text-ink/55">
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
        </ul>
      </main>
    </>
  )
}
