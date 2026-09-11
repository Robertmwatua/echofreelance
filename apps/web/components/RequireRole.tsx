import { useRouter } from 'next/router'
import { ReactNode, useEffect, useState } from 'react'
import { getStoredUser, homeForRole, normalizeRole, Role, UserProfile } from '../lib/api'

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

  useEffect(() => {
    const stored = getStoredUser()
    if (!stored) {
      router.replace(`/login?next=${encodeURIComponent(router.asPath)}`)
      return
    }
    const role = normalizeRole(stored.role as Role)
    if (!roles.includes(role)) {
      router.replace(homeForRole(stored.role))
      return
    }
    setUser({ ...stored, role })
    setReady(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.asPath, roles.join('|')])

  if (!ready || !user) {
    return (
      <main className="mx-auto max-w-6xl px-5 py-16 text-ink/60">Checking access…</main>
    )
  }

  return <>{children(user)}</>
}
