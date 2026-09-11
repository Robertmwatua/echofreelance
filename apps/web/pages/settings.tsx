import Link from 'next/link'
import { FormEvent, useEffect, useState } from 'react'
import DocumentHead from '../components/DocumentHead'
import { RequireRole } from '../components/RequireRole'
import { api, getStoredUser, setAuth, UserProfile } from '../lib/api'

export default function SettingsPage() {
  return (
    <RequireRole roles={['Student', 'Tutor', 'Admin']}>
      {(user) => <SettingsForm initial={user} />}
    </RequireRole>
  )
}

function SettingsForm({ initial }: { initial: UserProfile }) {
  const [name, setName] = useState(initial.name || '')
  const [headline, setHeadline] = useState(initial.headline || '')
  const [bio, setBio] = useState(initial.bio || '')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    api.me().then((u) => {
      setName(u.name || '')
      setHeadline(u.headline || '')
      setBio(u.bio || '')
      const token = localStorage.getItem('ef_token')
      if (token) setAuth(token, u)
    }).catch(() => {})
  }, [])

  async function saveProfile(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const updated = await api.updateProfile({ name, headline, bio })
      const token = localStorage.getItem('ef_token')
      if (token) setAuth(token, updated)
      setMessage('Profile saved.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save profile')
    } finally {
      setBusy(false)
    }
  }

  async function savePassword(e: FormEvent) {
    e.preventDefault()
    if (newPassword !== confirm) {
      setError('New passwords do not match')
      return
    }
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const res = await api.changePassword({ currentPassword, newPassword })
      setCurrentPassword('')
      setNewPassword('')
      setConfirm('')
      setMessage(res.message || 'Password updated.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update password')
    } finally {
      setBusy(false)
    }
  }

  const stored = getStoredUser()

  return (
    <>
      <DocumentHead title="Settings — EchoFreelance Tech School" />
      <main className="mx-auto max-w-2xl px-5 py-12">
        <p className="text-xs font-semibold uppercase tracking-wider text-fern">Account</p>
        <h1 className="mt-1 font-display text-4xl text-moss">Settings</h1>
        <p className="ef-muted mt-2">
          Update your profile and login credentials
          {stored?.role ? ` · signed in as ${stored.role}` : ''}.
        </p>

        {message && <p className="mt-6 text-moss">{message}</p>}
        {error && <p className="mt-6 text-red-400">{error}</p>}

        <form onSubmit={saveProfile} className="ef-panel mt-8 space-y-4">
          <h2 className="font-display text-xl text-ink">Profile</h2>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-ink/90">Display name</span>
            <input className="ef-input" value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-ink/90">Headline</span>
            <input
              className="ef-input"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="e.g. Cybersecurity tutor"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-ink/90">Bio</span>
            <textarea
              className="ef-input"
              rows={4}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
          </label>
          <p className="text-sm text-ink/55">Email: {initial.email}</p>
          <button type="submit" disabled={busy} className="ef-btn">
            Save profile
          </button>
        </form>

        <form onSubmit={savePassword} className="ef-panel mt-6 space-y-4">
          <h2 className="font-display text-xl text-ink">Password</h2>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-ink/90">Current password</span>
            <input
              type="password"
              required
              minLength={8}
              className="ef-input"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-ink/90">New password</span>
            <input
              type="password"
              required
              minLength={8}
              className="ef-input"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-ink/90">Confirm new password</span>
            <input
              type="password"
              required
              minLength={8}
              className="ef-input"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </label>
          <button type="submit" disabled={busy} className="ef-btn">
            Update password
          </button>
        </form>

        <p className="mt-8 text-sm text-ink/55">
          <Link href="/" className="text-fern hover:underline">
            ← Back to campus
          </Link>
        </p>
      </main>
    </>
  )
}
