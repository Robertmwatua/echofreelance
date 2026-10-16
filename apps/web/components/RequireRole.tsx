import { useRouter } from 'next/router'
import { ReactNode, useEffect, useState } from 'react'
import { api, getStoredUser, homeForRole, normalizeRole, UserProfile } from '../lib/api'

export function RequireRole({
  roles,
  children,
}: {
  roles: Array<'Student' | 'Tutor' | 'Admin'>
  children: (user: UserProfile) => ReactNode
}) {
  const router = useRouter()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const stored = getStoredUser()
    if (!stored) {
      router.replace(`/login?next=${encodeURIComponent(router.asPath)}`)
      return
    }
    let active = true
    setReady(false)
    api.me().then(profile => {
      if (!active) return
      const role = normalizeRole(profile.role)
      if (!roles.includes(role)) { router.replace(homeForRole(profile.role)); return }
      localStorage.setItem('ef_user', JSON.stringify({ ...profile, role }))
      setUser({ ...profile, role })
      setReady(true)
      setError('')
    }).catch((e: Error) => { if (active) setError(e.message) })
    return () => { active = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.asPath, roles.join('|'), attempt])

  if (error) return <main className="ef-page"><div role="alert" className="ef-panel"><h1 className="font-display text-2xl">Unable to verify your session</h1><p className="ef-muted mt-3">{error}</p><button className="ef-btn mt-4" onClick={() => { setError(''); setAttempt(a => a + 1) }}>Try again</button></div></main>

  if (!ready || !user) {
    return (
      <main className="mx-auto max-w-6xl px-5 py-16 ef-muted">Checking access…</main>
    )
  }

  return <>{children(user)}</>
}
