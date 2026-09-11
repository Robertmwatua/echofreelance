import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import DocumentHead from '../../components/DocumentHead'

/** CTF removed — send people to course discussions. */
export default function ChallengesRedirect() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/discussions')
  }, [router])

  return (
    <>
      <DocumentHead title="Discussions — EchoFreelance Tech School" />
      <main className="mx-auto max-w-3xl px-5 py-16">
        <p className="ef-muted">Redirecting to discussions…</p>
        <Link href="/discussions" className="ef-link mt-4 inline-block">
          Go to discussions
        </Link>
      </main>
    </>
  )
}
