import {Button,NavigationLink} from '../components/Button'
import { GoogleSignIn } from '../components/GoogleSignIn'
import { TechPhoto } from '../components/TechPhoto'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { FormEvent, useState } from 'react'
import DocumentHead from '../components/DocumentHead'
import { api, homeForRole, safeNext, setAuth } from '../lib/api'


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
      router.push(safeNext(next,homeForRole(res.user.role)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <DocumentHead title="Log in — EchoFreelance Tech School" />
      <main className="ef-auth-shell">
        <div className="ef-auth-layout mx-auto grid max-w-6xl gap-6 px-4 py-6 sm:px-6 sm:py-10 lg:grid-cols-2 lg:gap-10 lg:py-12">
          <TechPhoto variant="login" />

          <div className="min-w-0 flex flex-col justify-center py-2 sm:px-4 lg:px-4">
            <p className="ef-eyebrow">Account / welcome back</p>
            <h1 className="ef-title mt-4">Back to the work.</h1>
            <p className="ef-muted mt-2 text-sm">
              Access your courses, live classrooms, and learning hub.
            </p>
            {router.query.reason==='password-changed'&&<p className="ef-toast mt-6" role="status">Password updated. Please sign in again.</p>}
            {router.query.reason === 'session-expired' && <p role="status" className="ef-panel mt-6 text-sm">Your session expired or is no longer valid. Sign in again to continue.</p>}
            <GoogleSignIn/><form onSubmit={onSubmit} className="ef-panel mt-6 w-full space-y-4">
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
              {error && <p className="text-sm ef-text-danger ef-toast">{error}</p>}
              <Button type="submit" disabled={busy} className="ef-btn w-full">
                {busy ? 'Signing in…' : 'Sign in'}
              </Button>
            </form>
            <NavigationLink href="/forgot-password" className="ef-btn-ghost mt-5 inline-block">Forgot your password?</NavigationLink>
            <p className="mt-6 text-sm ef-muted">
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
