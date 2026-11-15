import { PageHeading, Toast } from '../../components/ui'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import DocumentHead from '../../components/DocumentHead'
import { RequireRole } from '../../components/RequireRole'
import { AdminStats, AdminUser, api, Role } from '../../lib/api'

export default function AdminPage() {
  return (
    <RequireRole roles={['Admin']}>
      {() => <AdminConsole />}
    </RequireRole>
  )
}

function AdminConsole() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [resetId, setResetId] = useState<string | null>(null)
  const [newPassword, setNewPassword] = useState('')

  async function load() {
    const [s, u] = await Promise.all([api.adminStats(), api.adminUsers()])
    setStats(s)
    setUsers(u)
  }

  useEffect(() => {
    load().catch((e: Error) => setError(e.message))
  }, [])

  async function changeRole(id: string, role: Role) {
    setMessage('')
    setError('')
    try {
      await api.setUserRole(id, role)
      await load()
      setMessage(`Role set to ${role}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Role update failed')
    }
  }

  async function resetPassword(id: string) {
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    setError('')
    setMessage('')
    try {
      await api.adminResetPassword(id, newPassword)
      setResetId(null)
      setNewPassword('')
      setMessage('Password reset for user.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Reset failed')
    }
  }

  return (
    <>
      <DocumentHead title="Admin — EchoFreelance Tech School" />
      <main className="mx-auto max-w-6xl px-6 py-12">
        <PageHeading label="07 / Administration" title="Keep the school moving." description="People, permissions and the details that keep learning on track." />
        <section className="ef-panel mt-8" aria-labelledby="admin-teaching"><p className="ef-section-label">Admin / teaching & school management</p><h2 id="admin-teaching" className="mt-3 text-3xl">You can teach here, too.</h2><p className="ef-muted mt-3 max-w-2xl">Admins can manage every course, teach classes, review students and promote registered users to Tutor. You don’t need to switch roles to teach.</p><div className="mt-6 flex flex-wrap gap-5"><Link href="/tutor?tab=live#instant-class" className="ef-btn">Start instant class →</Link><Link href="/tutor/classes/new" className="ef-btn-ghost">Schedule live class</Link><Link href="/tutor" className="ef-btn-ghost">Manage all courses</Link><Link href="/admin/payments" className="ef-btn-ghost">School fees & payments</Link><a href="#school-people" className="ef-btn-ghost">Add or manage tutors</a></div></section><div className="mt-4">
          <Link href="/settings" className="text-sm text-fern hover:underline">
            Your account settings →
          </Link>
        </div>

        {error && <Toast error>{error}</Toast>}
        {message && <Toast>{message}</Toast>}

        {stats && (
          <dl className="ef-admin-stats mt-10">
            {[
              ['Students', stats.students],
              ['Tutors', stats.tutors],
              ['Published courses', stats.publishedCourses],
              ['Enrollments', stats.enrollments],
              ['All courses', stats.courses],
              ['Upcoming classes', stats.upcomingClasses],
            ].map(([label, value]) => (
              <div key={label as string} className="">
                <dt className="text-xs   ef-muted">{label}</dt>
                <dd className="mt-1 font-display text-3xl text-ink">{value}</dd>
              </div>
            ))}
          </dl>
        )}

        <section className="mt-14" id="school-people">
          <h2 className="font-display text-2xl text-ink">People & credentials</h2><p className="ef-muted mt-3 max-w-2xl">To add a tutor, ask them to register an account, then choose Tutor beside their name below. Admins keep all teaching privileges.</p>
          <div className="ef-table-scroll mt-6"><table className="ef-data-table"><caption className="sr-only">School accounts and role management</caption><thead><tr><th scope="col">Person</th><th scope="col">Role</th><th scope="col">Manage access</th></tr></thead><tbody>
            {users.map(user=><tr key={user.id}><td><p className="font-semibold">{user.name || 'Unnamed account'}</p><p className="ef-meta mt-1">{user.email}</p></td><td><span className="ef-pill">{user.role}</span></td><td><div className="flex flex-wrap gap-3">{(['Student','Tutor','Admin'] as Role[]).map(role=><button key={role} type="button" disabled={user.role===role} onClick={()=>changeRole(user.id,role)} aria-label={`Set ${user.name || user.email} role to ${role}`} className="ef-btn-ghost text-xs">{role}</button>)}<button type="button" onClick={()=>{setResetId(user.id);setNewPassword('')}} className="ef-btn-ghost text-xs">Reset password</button></div>
            {resetId===user.id&&<div className="mt-4 flex flex-wrap items-end gap-4 border-t border-line pt-4"><label className="block flex-1 text-sm"><span className="mb-2 block">New password</span><input type="password" minLength={8} className="ef-input" value={newPassword} onChange={e=>setNewPassword(e.target.value)}/></label><button type="button" className="ef-btn" onClick={()=>resetPassword(user.id)}>Save password</button><button className="ef-btn-ghost" onClick={()=>setResetId(null)}>Cancel</button></div>}</td></tr>)}
          </tbody></table>{!users.length&&<p className="ef-meta p-6">{error?'Account list unavailable.':'Loading school accounts…'}</p>}</div>
        </section>
      </main>
    </>
  )
}
