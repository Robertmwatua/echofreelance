import Link from 'next/link'
import { useRouter } from 'next/router'
import { FormEvent, useState } from 'react'
import DocumentHead from '../components/DocumentHead'
import { api, setAuth } from '../lib/api'

const AUTH_WALL = '/wallpapers/learn.jpg'

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const res = await api.register({ email, password, name: name || undefined })
      setAuth(res.accessToken, res.user)
      router.push('/student')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <DocumentHead title="Apply — EchoFreelance Tech School" />
      <main className="ef-auth-shell">
        <div className="mx-auto grid min-h-[calc(100vh-4.25rem)] max-w-6xl lg:grid-cols-2">
          <div
            className="ef-auth-wall relative hidden min-h-[280px] lg:block"
            style={{
              backgroundImage: `linear-gradient(160deg, rgba(2,6,23,0.75), rgba(2,6,23,0.35)), url(${AUTH_WALL})`,
            }}
          >
            <div className="absolute inset-0 flex flex-col justify-end p-10">
              <p className="font-display text-4xl text-sand">Join the school</p>
              <p className="mt-3 max-w-sm text-sand/75">
                Start as a student — live classes, notes, and certificates await.
              </p>
            </div>
          </div>

          <div className="flex flex-col justify-center px-5 py-14 sm:px-10">
            <p className="font-display text-3xl text-moss sm:text-4xl">EchoFreelance Tech School</p>
            <h1 className="mt-3 text-xl font-medium text-ink/85">Student application</h1>
            <p className="ef-muted mt-2 text-sm">
              New accounts start as students. Admins promote tutors from the console.
            </p>
            <form onSubmit={onSubmit} className="ef-panel mt-8 max-w-md space-y-4">
              <label className="block text-sm">
                <span className="mb-1 block font-medium">Full name</span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="ef-input"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium">Email</span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="ef-input"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium">Password</span>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="ef-input"
                />
              </label>
              {error && <p className="text-sm text-red-400">{error}</p>}
              <button type="submit" disabled={busy} className="ef-btn w-full">
                {busy ? 'Creating…' : 'Join as student'}
              </button>
            </form>
            <p className="mt-6 text-sm text-ink/60">
              Already enrolled?{' '}
              <Link href="/login" className="text-fern hover:underline">
                Log in
              </Link>
            </p>
          </div>
        </div>
      </main>
    </>
  )
}
