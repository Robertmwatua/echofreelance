import { TechPhoto } from '../components/TechPhoto'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { FormEvent, useState } from 'react'
import DocumentHead from '../components/DocumentHead'
import { api, setAuth } from '../lib/api'


export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
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
      <DocumentHead title="Create account — EchoFreelance Tech School" />
      <main className="ef-auth-shell">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-10 lg:min-h-[calc(100vh-5rem)] lg:grid-cols-2 lg:py-12">
          <TechPhoto variant="register" />

          <div className="flex flex-col justify-center py-6 sm:px-6 lg:px-8">
            <p className="ef-eyebrow">A new chapter starts here</p>
            <h1 className="ef-title mt-4">Create your account.</h1>
            <p className="ef-muted mt-2 text-sm">
              Find your course, meet your tutors, and keep your learning in one place.
            </p>
            <form onSubmit={onSubmit} className="ef-panel mt-8 w-full space-y-5">
              <label className="block text-sm">
                <span className="mb-1 block font-medium">Full name</span>
                <input
                  type="text"
                  autoComplete="name"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="ef-input"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium">Email</span>
                <input
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="ef-input"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium">Password</span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  aria-describedby="password-help"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="ef-input"
                />
              </label>
              <div className="flex flex-wrap items-center justify-between gap-3"><p id="password-help" className="ef-meta text-xs">Use at least 8 characters.</p><button type="button" className="ef-link min-h-[44px] text-sm" aria-pressed={showPassword} onClick={() => setShowPassword(value => !value)}>{showPassword ? 'Hide password' : 'Show password'}</button></div>
              {error && <div role="alert" className="rounded-lg border border-amber-800/40 bg-amber-50 p-4 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-100"><p className="font-semibold">We couldn’t create your account</p><p className="mt-1">{error === 'Failed to fetch' ? 'Check your connection and try again. Your details are still here.' : error}</p></div>}
              <button type="submit" disabled={busy} className="ef-btn w-full">
                {busy ? 'Creating your account…' : 'Create account →'}
              </button>
            </form>
            <p className="mt-6 text-sm ef-muted">
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
