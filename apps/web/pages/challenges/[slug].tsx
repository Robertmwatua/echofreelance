import Link from 'next/link'
import { useRouter } from 'next/router'
import { FormEvent, useEffect, useState } from 'react'
import DocumentHead from '../../components/DocumentHead'
import { api, Challenge, getStoredUser } from '../../lib/api'

export default function ChallengeDetailPage() {
  const router = useRouter()
  const slug = typeof router.query.slug === 'string' ? router.query.slug : ''
  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [flag, setFlag] = useState('')
  const [showHint, setShowHint] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!slug) return
    api
      .challenge(slug)
      .then(setChallenge)
      .catch((e: Error) => setError(e.message))
  }, [slug])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!getStoredUser()) {
      router.push(`/login?next=/challenges/${slug}`)
      return
    }
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const res = await api.submitFlag(slug, flag)
      setMessage(`${res.message} (+${res.points} pts)`)
      setChallenge(await api.challenge(slug))
      setFlag('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submit failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <DocumentHead title={challenge ? `${challenge.title} — CTF` : 'Challenge'} />
      <main className="mx-auto max-w-3xl px-5 py-12">
        <Link href="/challenges" className="text-sm text-fern hover:underline">
          ← Arena
        </Link>
        {error && !challenge && <p className="mt-8 text-red-400">{error}</p>}
        {challenge && (
          <div className="ef-panel mt-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-fern">
              {challenge.category} · {challenge.difficulty} · {challenge.points} pts
              {challenge.solved ? ' · Solved ✓' : ''}
            </p>
            <h1 className="mt-2 font-display text-4xl text-moss">{challenge.title}</h1>
            <p className="ef-muted mt-4 whitespace-pre-wrap text-lg">{challenge.description}</p>
            {challenge.hint && (
              <div className="mt-6">
                <button
                  type="button"
                  className="text-sm text-fern hover:underline"
                  onClick={() => setShowHint((v) => !v)}
                >
                  {showHint ? 'Hide hint' : 'Show hint'}
                </button>
                {showHint && <p className="mt-2 text-sm text-citrus">{challenge.hint}</p>}
              </div>
            )}

            {!challenge.solved ? (
              <form onSubmit={onSubmit} className="mt-8 space-y-3">
                <label className="block text-sm">
                  <span className="mb-1 block font-medium">Flag</span>
                  <input
                    className="ef-input font-mono"
                    placeholder="EF{...}"
                    value={flag}
                    onChange={(e) => setFlag(e.target.value)}
                    required
                  />
                </label>
                {error && <p className="text-sm text-red-400">{error}</p>}
                {message && <p className="text-sm text-moss">{message}</p>}
                <button type="submit" disabled={busy} className="ef-btn">
                  {busy ? 'Checking…' : 'Submit flag'}
                </button>
              </form>
            ) : (
              <p className="mt-8 text-moss">You already owned this one.</p>
            )}
          </div>
        )}
      </main>
    </>
  )
}
