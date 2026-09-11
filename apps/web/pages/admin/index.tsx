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
      <main className="mx-auto max-w-6xl px-5 py-12">
        <p className="text-xs font-semibold uppercase tracking-wider text-fern">Admin</p>
        <h1 className="mt-1 font-display text-4xl text-moss">Campus control</h1>
        <p className="ef-muted mt-2">
          Promote tutors, reset credentials, and watch the school grow. Courses are created by
          tutors — not seeded.
        </p>
        <div className="mt-4">
          <Link href="/settings" className="text-sm text-fern hover:underline">
            Your account settings →
          </Link>
        </div>

        {error && <p className="mt-6 text-red-400">{error}</p>}
        {message && <p className="mt-6 text-moss">{message}</p>}

        {stats && (
          <dl className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              ['Students', stats.students],
              ['Tutors', stats.tutors],
              ['Published courses', stats.publishedCourses],
              ['Enrollments', stats.enrollments],
              ['All courses', stats.courses],
              ['Upcoming classes', stats.upcomingClasses],
            ].map(([label, value]) => (
              <div key={label as string} className="ef-panel !p-4">
                <dt className="text-xs uppercase tracking-wide text-ink/50">{label}</dt>
                <dd className="mt-1 font-display text-3xl text-moss">{value}</dd>
              </div>
            ))}
          </dl>
        )}

        <section className="mt-14">
          <h2 className="font-display text-2xl text-moss">People & credentials</h2>
          <ul className="mt-6 space-y-4">
            {users.map((user) => (
              <li key={user.id} className="ef-panel !p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-medium text-ink">{user.name || 'Unnamed'}</p>
                    <p className="text-sm text-ink/60">
                      {user.email} · {user.role}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(['Student', 'Tutor', 'Admin'] as Role[]).map((role) => (
                      <button
                        key={role}
                        type="button"
                        disabled={user.role === role}
                        onClick={() => changeRole(user.id, role)}
                        className="ef-btn-ghost !px-3 !py-1.5 text-xs disabled:opacity-40"
                      >
                        {role}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        setResetId(user.id)
                        setNewPassword('')
                      }}
                      className="ef-btn-ghost !px-3 !py-1.5 text-xs"
                    >
                      Reset password
                    </button>
                  </div>
                </div>
                {resetId === user.id && (
                  <div className="mt-4 flex flex-wrap items-end gap-2 border-t border-line/30 pt-4">
                    <label className="block flex-1 text-sm">
                      <span className="mb-1 block text-ink/70">New password</span>
                      <input
                        type="password"
                        minLength={8}
                        className="ef-input"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                    </label>
                    <button type="button" className="ef-btn" onClick={() => resetPassword(user.id)}>
                      Save
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>
      </main>
    </>
  )
}
