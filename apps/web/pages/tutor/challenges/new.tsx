import Link from 'next/link'
import { useRouter } from 'next/router'
import { FormEvent, useState } from 'react'
import DocumentHead from '../../../components/DocumentHead'
import { RequireRole } from '../../../components/RequireRole'
import { api, CTF_CATEGORIES } from '../../../lib/api'

export default function NewChallengePage() {
  return (
    <RequireRole roles={['Tutor', 'Admin']}>
      {() => <NewChallengeForm />}
    </RequireRole>
  )
}

function NewChallengeForm() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<string>('Pwn')
  const [difficulty, setDifficulty] = useState('Easy')
  const [points, setPoints] = useState(100)
  const [description, setDescription] = useState('')
  const [hint, setHint] = useState('')
  const [flag, setFlag] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const created = await api.createChallenge({
        title,
        category,
        difficulty,
        points,
        description,
        hint: hint || undefined,
        flag,
      })
      router.push(`/challenges/${created.slug}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create challenge')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <DocumentHead title="New CTF challenge — Tutor" />
      <main className="mx-auto max-w-2xl px-5 py-12">
        <Link href="/tutor" className="text-sm text-fern hover:underline">
          ← Tutor desk
        </Link>
        <h1 className="mt-4 font-display text-4xl text-moss">Author a challenge</h1>
        <p className="ef-muted mt-2">
          Flags are stored hashed. Prefer <code className="text-fern">EF{'{...}'}</code> format.
        </p>
        <form onSubmit={onSubmit} className="ef-panel mt-8 space-y-4">
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Title</span>
            <input required className="ef-input" value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Category</span>
              <select className="ef-input" value={category} onChange={(e) => setCategory(e.target.value)}>
                {CTF_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Difficulty</span>
              <select
                className="ef-input"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
              >
                <option>Easy</option>
                <option>Medium</option>
                <option>Hard</option>
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Points</span>
              <input
                type="number"
                min={1}
                className="ef-input"
                value={points}
                onChange={(e) => setPoints(Number(e.target.value))}
              />
            </label>
          </div>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Description / prompt</span>
            <textarea
              required
              minLength={20}
              rows={5}
              className="ef-input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Hint (optional)</span>
            <input className="ef-input" value={hint} onChange={(e) => setHint(e.target.value)} />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Flag (secret)</span>
            <input
              required
              minLength={4}
              className="ef-input font-mono"
              value={flag}
              onChange={(e) => setFlag(e.target.value)}
              placeholder="EF{example}"
            />
          </label>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button type="submit" disabled={busy} className="ef-btn">
            {busy ? 'Publishing…' : 'Publish challenge'}
          </button>
        </form>
      </main>
    </>
  )
}
