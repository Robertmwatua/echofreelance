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
  const [menuOpen, setMenuOpen] = useState(false)

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
    setMenuOpen(false)
    setOpenNotifs(false)
  }, [router.pathname, refreshUnread])

  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [menuOpen])

  async function openBell() {
    const next = !openNotifs
    setOpenNotifs(next)
    setMenuOpen(false)
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
    setMenuOpen(false)
    router.push('/')
  }

  const role = user ? normalizeRole(user.role) : null

  const linkClass =
    'block rounded-lg px-3 py-2.5 text-ink/90 transition hover:bg-mist/70 hover:text-moss md:inline md:rounded-none md:px-0 md:py-0 md:hover:bg-transparent'

  return (
    <div className="min-h-screen font-sans text-ink">
      <header className="sticky top-0 z-40 border-b border-line/30 bg-panel/75 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-3.5">
          <Link
            href="/"
            className="font-display text-2xl tracking-tight text-moss transition hover:brightness-110"
          >
            EchoFreelance
          </Link>

          <div className="flex items-center gap-2">
            {user && (
              <button
                type="button"
                onClick={openBell}
                className="ef-btn-ghost !px-2.5 !py-1.5 text-xs md:hidden"
                aria-label="Notifications"
              >
                Alerts{unread > 0 ? ` (${unread})` : ''}
              </button>
            )}
            <button
              type="button"
              className="ef-btn-ghost !px-2.5 !py-2 md:hidden"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              onClick={() => {
                setMenuOpen((o) => !o)
                setOpenNotifs(false)
              }}
            >
              <span className="flex w-5 flex-col gap-1.5" aria-hidden>
                <span
                  className={`block h-0.5 w-full bg-ink transition ${menuOpen ? 'translate-y-2 rotate-45' : ''}`}
                />
                <span
                  className={`block h-0.5 w-full bg-ink transition ${menuOpen ? 'opacity-0' : ''}`}
                />
                <span
                  className={`block h-0.5 w-full bg-ink transition ${menuOpen ? '-translate-y-2 -rotate-45' : ''}`}
                />
              </span>
            </button>

            <nav className="hidden items-center gap-x-3 text-sm font-medium text-ink/85 md:flex">
              <Link href="/courses" className="hover:text-moss">
                Courses
              </Link>
              <Link href="/classes" className="hover:text-moss">
                Live classes
              </Link>
              <Link href="/discussions" className="hover:text-moss">
                Discussions
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
                  <Link href="/notes" className="hover:text-moss">
                    Notes
                  </Link>
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
                  <span className="hidden text-ink/55 lg:inline">
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
        </div>

        {menuOpen && (
          <div className="border-t border-line/30 bg-panel/95 px-5 py-4 shadow-lg md:hidden">
            <nav className="ef-menu-panel flex flex-col gap-1 text-sm font-medium">
              <Link href="/courses" className={linkClass} onClick={() => setMenuOpen(false)}>
                Courses
              </Link>
              <Link href="/classes" className={linkClass} onClick={() => setMenuOpen(false)}>
                Live classes
              </Link>
              <Link href="/discussions" className={linkClass} onClick={() => setMenuOpen(false)}>
                Discussions
              </Link>
              {user ? (
                <>
                  {role === 'Student' && (
                    <Link href="/student" className={linkClass} onClick={() => setMenuOpen(false)}>
                      Hub
                    </Link>
                  )}
                  {role === 'Tutor' && (
                    <Link href="/tutor" className={linkClass} onClick={() => setMenuOpen(false)}>
                      Tutor
                    </Link>
                  )}
                  {role === 'Admin' && (
                    <Link href="/admin" className={linkClass} onClick={() => setMenuOpen(false)}>
                      Admin
                    </Link>
                  )}
                  <Link href="/notes" className={linkClass} onClick={() => setMenuOpen(false)}>
                    Notes
                  </Link>
                  <Link
                    href="/certificates/mine"
                    className={linkClass}
                    onClick={() => setMenuOpen(false)}
                  >
                    Certs
                  </Link>
                  <Link href="/settings" className={linkClass} onClick={() => setMenuOpen(false)}>
                    Settings
                  </Link>
                  <p className="px-3 pt-2 text-xs text-ink/50">
                    {user.name || user.email} · {role}
                  </p>
                  <button
                    type="button"
                    onClick={() => setTheme(toggleTheme())}
                    className={`${linkClass} w-full text-left`}
                  >
                    Theme: {theme === 'dark' ? 'Light' : 'Dark'}
                  </button>
                  <button
                    type="button"
                    onClick={logout}
                    className={`${linkClass} w-full text-left text-red-400`}
                  >
                    Log out
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setTheme(toggleTheme())}
                    className={`${linkClass} w-full text-left`}
                  >
                    Theme: {theme === 'dark' ? 'Light' : 'Dark'}
                  </button>
                  <Link href="/login" className={linkClass} onClick={() => setMenuOpen(false)}>
                    Log in
                  </Link>
                  <Link
                    href="/register"
                    className="ef-btn mt-2 !py-2.5 text-center"
                    onClick={() => setMenuOpen(false)}
                  >
                    Join school
                  </Link>
                </>
              )}
            </nav>
          </div>
        )}

        {openNotifs && (
          <div className="border-t border-line/30 bg-panel px-5 py-3 md:hidden">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-fern">
                Notifications
              </p>
              {unread > 0 && (
                <button type="button" onClick={readAll} className="text-xs text-fern hover:underline">
                  Mark all read
                </button>
              )}
            </div>
            {notifs.length === 0 ? (
              <p className="text-sm text-ink/55">No notifications yet.</p>
            ) : (
              <ul className="max-h-64 space-y-2 overflow-y-auto">
                {notifs.map((n) => (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => readOne(n)}
                      className={`w-full rounded-md px-2 py-2 text-left text-sm hover:bg-mist ${
                        n.read ? 'opacity-60' : ''
                      }`}
                    >
                      <span className="block font-medium">{n.title}</span>
                      <span className="mt-0.5 block text-xs text-ink/60">{n.body}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </header>
      <div className="ef-page-enter">{children}</div>
    </div>
  )
}
