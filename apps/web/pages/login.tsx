import Link from 'next/link'
import { useRouter } from 'next/router'
import { FormEvent, useState } from 'react'
import DocumentHead from '../components/DocumentHead'
import { api, homeForRole, setAuth } from '../lib/api'

const AUTH_WALL = '/wallpapers/learn.jpg'

export default function LoginPage() {
  const router = useRouter()
  const next = typeof router.query.next === 'string' ? router.query.next : ''
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const res = await api.login({ email, password })
      setAuth(res.accessToken, res.user)
      router.push(next || homeForRole(res.user.role))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <DocumentHead title="Log in — EchoFreelance" />
      <main className="ef-auth-shell">
        <div className="mx-auto grid min-h-[calc(100vh-4.25rem)] max-w-6xl lg:grid-cols-2">
          <div
            className="ef-auth-wall relative hidden min-h-[280px] lg:block"
            style={{
              backgroundImage: `linear-gradient(160deg, rgba(2,6,23,0.75), rgba(2,6,23,0.35)), url(${AUTH_WALL})`,
            }}
          >
            <div className="absolute inset-0 flex flex-col justify-end p-10">
              <p className="font-display text-4xl text-sand">Campus access</p>
              <p className="mt-3 max-w-sm text-sand/75">
                Sign in to classes, labs, and your learning hub.
              </p>
            </div>
          </div>

          <div className="flex flex-col justify-center px-5 py-14 sm:px-10">
            <p className="font-display text-4xl text-moss sm:text-5xl">EchoFreelance</p>
            <h1 className="mt-3 text-xl font-medium text-ink/85">Sign in</h1>
            <p className="ef-muted mt-2 text-sm">
              Access your courses, live classrooms, and learning hub.
            </p>
            <form onSubmit={onSubmit} className="ef-panel mt-8 max-w-md space-y-4">
              <label className="block text-sm">
                <span className="mb-1 block font-medium">Email</span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="ef-input"
                  autoComplete="email"
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
                  autoComplete="current-password"
                />
              </label>
              {error && <p className="text-sm text-red-400">{error}</p>}
              <button type="submit" disabled={busy} className="ef-btn w-full">
                {busy ? 'Signing in…' : 'Sign in'}
              </button>
            </form>
            <p className="mt-6 text-sm text-ink/60">
              New student?{' '}
              <Link href="/register" className="text-fern hover:underline">
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </main>
    </>
  )
}
