import { GoogleSignIn } from '../components/GoogleSignIn'
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
        <div className="ef-auth-layout mx-auto grid max-w-6xl gap-6 px-4 py-6 sm:px-6 sm:py-10 lg:min-h-[calc(100vh-5rem)] lg:grid-cols-2 lg:gap-10 lg:py-12">
          <TechPhoto variant="register" />

          <div className="min-w-0 flex flex-col justify-center py-2 sm:px-4 lg:px-4">
            <p className="ef-eyebrow">Account / your first step</p>
            <h1 className="ef-title mt-4">Create your account.</h1>
            <p className="ef-muted mt-2 text-sm">
              Find your course, meet your tutors, and keep your learning in one place.
            </p>
            <GoogleSignIn/><form onSubmit={onSubmit} className="ef-panel mt-6 w-full space-y-5">
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
              {error && <div role="alert" className="ef-toast"><p className="font-semibold">We couldn’t create your account</p><p className="mt-1">{error === 'Failed to fetch' ? 'Check your connection and try again. Your details are still here.' : error}</p></div>}
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
