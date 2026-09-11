import Link from 'next/link'
import { useRouter } from 'next/router'
import { ReactNode, useCallback, useEffect, useState } from 'react'
import {
  api,
  AppNotification,
  clearAuth,
  getStoredUser,
  normalizeRole,
  UserProfile,
} from '../lib/api'
import { applyTheme, getStoredTheme, Theme, toggleTheme } from '../lib/theme'

export function SiteShell({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [theme, setTheme] = useState<Theme>('dark')
  const [unread, setUnread] = useState(0)
  const [openNotifs, setOpenNotifs] = useState(false)
  const [notifs, setNotifs] = useState<AppNotification[]>([])

  const refreshUnread = useCallback(() => {
    if (!getStoredUser()) {
      setUnread(0)
      return
    }
    api
      .unreadNotifications()
      .then((r) => setUnread(r.count))
      .catch(() => setUnread(0))
  }, [])

  useEffect(() => {
    const t = getStoredTheme()
    applyTheme(t)
    setTheme(t)
    setUser(getStoredUser())
    refreshUnread()
  }, [router.pathname, refreshUnread])

  async function openBell() {
    const next = !openNotifs
    setOpenNotifs(next)
    if (!next || !getStoredUser()) return
    try {
      const list = await api.notifications()
      setNotifs(list)
    } catch {
      setNotifs([])
    }
  }

  async function readOne(n: AppNotification) {
    try {
      await api.markNotificationRead(n.id)
      setNotifs((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)))
      refreshUnread()
      if (n.href) {
        setOpenNotifs(false)
        router.push(n.href)
      }
    } catch {
      /* ignore */
    }
  }

  async function readAll() {
    try {
      await api.markAllNotificationsRead()
      setNotifs((prev) => prev.map((x) => ({ ...x, read: true })))
      setUnread(0)
    } catch {
      /* ignore */
    }
  }

  function logout() {
    clearAuth()
    setUser(null)
    setUnread(0)
    router.push('/')
  }

  const role = user ? normalizeRole(user.role) : null

  return (
    <div className="min-h-screen font-sans text-ink">
      <header className="sticky top-0 z-30 border-b border-line/30 bg-panel/70 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3.5">
          <Link
            href="/"
            className="font-display text-2xl tracking-tight text-moss transition hover:brightness-110"
          >
            EchoFreelance
          </Link>
          <nav className="flex flex-wrap items-center justify-end gap-x-3 gap-y-2 text-sm font-medium text-ink/85">
            <Link href="/courses" className="hover:text-moss">
              Courses
            </Link>
            <Link href="/classes" className="hover:text-moss">
              Live classes
            </Link>
            <Link href="/challenges" className="hover:text-moss">
              CTF
            </Link>
            {user ? (
              <>
                {role === 'Student' && (
                  <Link href="/student" className="hover:text-moss">
                    Hub
                  </Link>
                )}
                {role === 'Tutor' && (
                  <Link href="/tutor" className="hover:text-moss">
                    Tutor
                  </Link>
                )}
                {role === 'Admin' && (
                  <Link href="/admin" className="hover:text-moss">
                    Admin
                  </Link>
                )}
                <Link href="/certificates/mine" className="hover:text-moss">
                  Certs
                </Link>
                <Link href="/settings" className="hover:text-moss">
                  Settings
                </Link>
                <div className="relative">
                  <button
                    type="button"
                    onClick={openBell}
                    className="ef-btn-ghost !px-2.5 !py-1.5 text-xs"
                    aria-label="Notifications"
                  >
                    Alerts{unread > 0 ? ` (${unread})` : ''}
                  </button>
                  {openNotifs && (
                    <div className="absolute right-0 mt-2 w-80 max-w-[90vw] rounded-md border border-line/50 bg-panel p-3 shadow-lg">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-fern">
                          Notifications
                        </p>
                        {unread > 0 && (
                          <button
                            type="button"
                            onClick={readAll}
                            className="text-xs text-fern hover:underline"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>
                      {notifs.length === 0 ? (
                        <p className="text-sm text-ink/55">No notifications yet.</p>
                      ) : (
                        <ul className="max-h-72 space-y-2 overflow-y-auto">
                          {notifs.map((n) => (
                            <li key={n.id}>
                              <button
                                type="button"
                                onClick={() => readOne(n)}
                                className={`w-full rounded-md px-2 py-2 text-left text-sm hover:bg-mist ${
                                  n.read ? 'opacity-60' : ''
                                }`}
                              >
                                <span className="block font-medium text-ink">{n.title}</span>
                                <span className="mt-0.5 block text-xs text-ink/60">{n.body}</span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
                <span className="hidden text-ink/55 sm:inline">
                  {user.name || user.email}
                  <span className="ml-1 text-[10px] uppercase tracking-wider text-fern">
                    {role}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => setTheme(toggleTheme())}
                  className="ef-btn-ghost !px-2.5 !py-1.5 text-xs"
                  aria-label="Toggle theme"
                >
                  {theme === 'dark' ? 'Light' : 'Dark'}
                </button>
                <button type="button" onClick={logout} className="ef-btn-ghost !py-1.5">
                  Log out
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setTheme(toggleTheme())}
                  className="ef-btn-ghost !px-2.5 !py-1.5 text-xs"
                >
                  {theme === 'dark' ? 'Light' : 'Dark'}
                </button>
                <Link href="/login" className="hover:text-moss">
                  Log in
                </Link>
                <Link href="/register" className="ef-btn !py-1.5">
                  Join school
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>
      {children}
    </div>
  )
}
