import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import DocumentHead from '../../components/DocumentHead'
import { api, Challenge, CTF_CATEGORIES, LeaderboardRow } from '../../lib/api'

export default function ChallengesPage() {
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [board, setBoard] = useState<LeaderboardRow[]>([])
  const [category, setCategory] = useState('')
  const [q, setQ] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .challenges(category || undefined)
      .then(setChallenges)
      .catch((e: Error) => setError(e.message))
    api.leaderboard().then(setBoard).catch(() => {})
  }, [category])

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!needle) return challenges
    return challenges.filter(
      (c) =>
        c.title.toLowerCase().includes(needle) ||
        c.description.toLowerCase().includes(needle) ||
        c.category.toLowerCase().includes(needle),
    )
  }, [challenges, q])

  return (
    <>
      <DocumentHead title="CTF Arena — EchoFreelance" />
      <main className="mx-auto max-w-6xl px-5 py-12">
        <p className="text-xs font-semibold uppercase tracking-wider text-fern">Practice</p>
        <h1 className="mt-1 font-display text-4xl text-moss">CTF / Pwn arena</h1>
        <p className="ef-muted mt-2 max-w-2xl">
          Capture-the-flag labs for web, pwn, crypto, and more. Submit flags in{' '}
          <code className="text-fern">EF{'{...}'}</code> format. Tutors can author new challenges.
        </p>

        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <input
            className="ef-input max-w-md"
            placeholder="Search challenges…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setCategory('')}
              className={`rounded-lg px-3 py-1.5 text-sm ${
                !category ? 'bg-moss text-slate-950' : 'ef-btn-ghost !py-1.5'
              }`}
            >
              All
            </button>
            {CTF_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`rounded-lg px-3 py-1.5 text-sm ${
                  category === cat ? 'bg-moss text-slate-950' : 'ef-btn-ghost !py-1.5'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="mt-6 text-red-400">{error}</p>}

        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_280px]">
          <ul className="space-y-4">
            {filtered.map((c) => (
              <li key={c.id} className="ef-panel !p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-fern">
                      {c.category} · {c.difficulty} · {c.points} pts
                      {c.solved ? ' · Solved' : ''}
                    </p>
                    <Link
                      href={`/challenges/${c.slug}`}
                      className="mt-1 block font-display text-2xl text-ink hover:text-moss"
                    >
                      {c.title}
                    </Link>
                    <p className="ef-muted mt-2 line-clamp-2 text-sm">{c.description}</p>
                  </div>
                  <Link href={`/challenges/${c.slug}`} className="ef-btn !py-2">
                    {c.solved ? 'View' : 'Open'}
                  </Link>
                </div>
              </li>
            ))}
            {filtered.length === 0 && (
              <div className="ef-panel">
                <p className="text-ink/80">No challenges in this filter.</p>
              </div>
            )}
          </ul>

          <aside className="ef-panel h-fit">
            <h2 className="font-display text-xl text-moss">Leaderboard</h2>
            <ol className="mt-4 space-y-3">
              {board.map((row) => (
                <li key={row.user.id} className="flex items-center justify-between text-sm">
                  <span>
                    <span className="text-ink/45">#{row.rank}</span>{' '}
                    {row.user.name || row.user.email}
                  </span>
                  <span className="font-semibold text-fern">{row.points}</span>
                </li>
              ))}
              {board.length === 0 && <p className="text-sm text-ink/55">No solves yet.</p>}
            </ol>
            <Link href="/tutor/challenges/new" className="mt-6 block text-sm text-fern hover:underline">
              Tutor: author a challenge →
            </Link>
          </aside>
        </div>
      </main>
    </>
  )
}
