import { RedirectNote } from '../components/ui'
import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { getStoredUser, homeForRole } from '../lib/api'

/** Legacy path — send people to the role hub. */
export default function DashboardRedirect() {
  const router = useRouter()
  useEffect(() => {
    const user = getStoredUser()
    router.replace(user ? homeForRole(user.role) : '/login')
  }, [router])
  return <RedirectNote href="/login"/>
}
