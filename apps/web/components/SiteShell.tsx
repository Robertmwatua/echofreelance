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
import { SITE_NAME } from '../lib/brand'
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
    const close = (event: MouseEvent | KeyboardEvent) => {
      const account = document.querySelector<HTMLDetailsElement>('.ef-account')
      if (account && (event instanceof KeyboardEvent ? event.key === 'Escape' : !account.contains(event.target as Node))) account.open = false
    }
    document.addEventListener('click', close)
    document.addEventListener('keydown', close)
    return () => { document.removeEventListener('click', close); document.removeEventListener('keydown', close) }
  }, [])

  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [menuOpen])

  useEffect(() => {
    const timer = setInterval(refreshUnread, 60000)
    return () => clearInterval(timer)
  }, [refreshUnread])

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

  const isActive = (href: string) => router.pathname === href || (href !== '/' && router.pathname.startsWith(`${href}/`))

  const role = user ? normalizeRole(user.role) : null

  const linkClass =
    'block rounded-lg px-3 py-2.5 text-ink/90 transition hover:bg-mist/70 hover:text-moss lg:inline lg:rounded-none lg:px-0 lg:py-0 lg:hover:bg-transparent'

  return (
    <div className="min-h-screen font-sans text-ink">
      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/80 backdrop-blur-md dark:border-slate-800/60 dark:bg-slate-950/70">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-3.5">
          <Link
            href="/"
            className="font-display text-base leading-tight tracking-tight text-moss transition hover:brightness-110 sm:text-lg lg:text-xl"
          >
            {SITE_NAME}
          </Link>

          <div className="flex items-center gap-2">
            {user && (
              <button
                type="button"
                onClick={openBell}
                className="ef-btn-ghost !px-2.5 !py-1.5 text-xs lg:hidden"
                aria-label="Notifications"
              >
                Alerts{unread > 0 ? ` (${unread})` : ''}
              </button>
            )}
            <button
              type="button"
              className="ef-btn-ghost !px-2.5 !py-2 lg:hidden"
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

            <nav className="hidden items-center gap-x-1 text-sm font-medium text-ink/85 lg:flex">
              <Link href="/courses" aria-current={isActive('/courses') ? 'page' : undefined} className="ef-nav-link">
                Courses
              </Link>
              <Link href="/classes" aria-current={isActive('/classes') ? 'page' : undefined} className="ef-nav-link">
                Live classes
              </Link>
              <Link href="/discussions" aria-current={isActive('/discussions') ? 'page' : undefined} className="ef-nav-link">
                Community
              </Link>
              {user ? (
                <>
                  {role === 'Student' && (
                    <Link href="/student" aria-current={isActive('/student') ? 'page' : undefined} className="ef-nav-link">
                      My learning
                    </Link>
                  )}
                  {role === 'Tutor' && (
                    <Link href="/tutor" aria-current={isActive('/tutor') ? 'page' : undefined} className="ef-nav-link">
                      Tutor
                    </Link>
                  )}
                  {role === 'Admin' && (
                    <Link href="/admin" aria-current={isActive('/admin') ? 'page' : undefined} className="ef-nav-link">
                      Admin
                    </Link>
                  )}
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
                      <div className="absolute right-0 mt-2 w-80 max-w-[90vw] rounded-md border border-line bg-panel p-3 shadow-lg">
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
                          <p className="text-sm ef-muted">No notifications yet.</p>
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
                                  <span className="mt-0.5 block text-xs ef-muted">{n.body}</span>
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>
                  <details className="ef-account relative" key={router.asPath} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node)) event.currentTarget.open = false }}>
                    <summary className="ef-btn-ghost cursor-pointer">Account <span aria-hidden>⌄</span></summary>
                    <div className="absolute right-0 mt-3 w-60 rounded-2xl border border-line bg-panel p-2 shadow-xl">
                  <Link href="/notes" className="ef-account-action">
                    Notes
                  </Link>
                  <Link href="/certificates/mine" className="ef-account-action">
                    Certificates
                  </Link>
                  <Link href="/settings" className="ef-account-action">
                    Settings
                  </Link>
                  <span className="block border-b border-line px-3 pb-3 ef-muted">
                    {user.name || user.email}
                    <span className="ml-1 text-[10px] uppercase tracking-wider text-fern">
                      {role}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setTheme(toggleTheme())}
                    className="ef-account-action"
                    aria-label="Toggle theme"
                  >
                    {theme === 'dark' ? 'Light' : 'Dark'}
                  </button>
                  <button type="button" onClick={logout} className="ef-account-action">
                    Log out
                  </button>                    </div>
                  </details>
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
          <div className="border-t border-line bg-panel px-5 py-4 shadow-lg lg:hidden">
            <nav className="ef-menu-panel flex flex-col gap-1 text-sm font-medium">
              <Link href="/courses" aria-current={isActive('/courses') ? 'page' : undefined} className={`${linkClass} ef-nav-link`} onClick={() => setMenuOpen(false)}>
                Courses
              </Link>
              <Link href="/classes" aria-current={isActive('/classes') ? 'page' : undefined} className={`${linkClass} ef-nav-link`} onClick={() => setMenuOpen(false)}>
                Live classes
              </Link>
              <Link href="/discussions" aria-current={isActive('/discussions') ? 'page' : undefined} className={`${linkClass} ef-nav-link`} onClick={() => setMenuOpen(false)}>
                Community
              </Link>
              {user ? (
                <>
                  {role === 'Student' && (
                    <Link href="/student" aria-current={isActive('/student') ? 'page' : undefined} className={`${linkClass} ef-nav-link`} onClick={() => setMenuOpen(false)}>
                      My learning
                    </Link>
                  )}
                  {role === 'Tutor' && (
                    <Link href="/tutor" aria-current={isActive('/tutor') ? 'page' : undefined} className={`${linkClass} ef-nav-link`} onClick={() => setMenuOpen(false)}>
                      Tutor
                    </Link>
                  )}
                  {role === 'Admin' && (
                    <Link href="/admin" aria-current={isActive('/admin') ? 'page' : undefined} className={`${linkClass} ef-nav-link`} onClick={() => setMenuOpen(false)}>
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
                    Certificates
                  </Link>
                  <Link href="/settings" className={linkClass} onClick={() => setMenuOpen(false)}>
                    Settings
                  </Link>
                  <p className="px-3 pt-2 text-xs ef-muted">
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
          <div className="border-t border-line bg-panel px-5 py-3 lg:hidden">
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
              <p className="text-sm ef-muted">No notifications yet.</p>
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
                      <span className="mt-0.5 block text-xs ef-muted">{n.body}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </header>
      <a href="#main-content" className="ef-skip-link">Skip to content</a>
      <div id="main-content" tabIndex={-1}>{children}</div>
    </div>
  )
}
