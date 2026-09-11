import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import DocumentHead from '../../components/DocumentHead'
import { api, Certificate } from '../../lib/api'

export default function CertificatePage() {
  const router = useRouter()
  const code = typeof router.query.code === 'string' ? router.query.code : ''
  const [cert, setCert] = useState<Certificate | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!code) return
    api
      .getCertificate(code)
      .then(setCert)
      .catch((e: Error) => setError(e.message))
  }, [code])

  return (
    <>
      <DocumentHead title={cert ? `Certificate ${cert.code}` : 'Certificate'} />
      <main className="mx-auto max-w-2xl px-5 py-12">
        <Link href="/certificates/mine" className="text-sm text-fern hover:underline">
          ← My certificates
        </Link>
        {error && <p className="mt-8 text-red-400">{error}</p>}
        {cert && (
          <div className="ef-panel mt-6 border border-moss/30 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-fern">
              EchoFreelance
            </p>
            <h1 className="mt-4 font-display text-3xl text-moss">Certificate of completion</h1>
            <p className="ef-muted mt-6 text-lg">This certifies that</p>
            <p className="mt-2 font-display text-2xl text-ink">
              {cert.user?.name || cert.user?.email || 'Learner'}
            </p>
            <p className="ef-muted mt-6">has completed</p>
            <p className="mt-2 font-display text-2xl text-moss">{cert.course.title}</p>
            <p className="mt-2 text-sm text-ink/55">
              {[cert.course.category, cert.course.level].filter(Boolean).join(' · ')}
            </p>
            <p className="mt-8 text-sm text-ink/60">
              Issued {new Date(cert.issuedAt).toLocaleDateString()}
            </p>
            <p className="mt-2 font-mono text-xs text-fern">{cert.code}</p>
            <Link
              href={`/courses/${cert.course.id}`}
              className="mt-8 inline-block text-sm text-fern hover:underline"
            >
              View course →
            </Link>
          </div>
        )}
      </main>
    </>
  )
}
