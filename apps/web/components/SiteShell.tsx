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
import { AskTutor } from './AskTutor'

export function SiteShell({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [theme, setTheme] = useState<Theme>('light')
  const [unread, setUnread] = useState(0)
  const [openNotifs, setOpenNotifs] = useState(false)
  const [notifs, setNotifs] = useState<AppNotification[]>([])
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

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
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

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
      <header className={`ef-site-header ${scrolled ? 'is-scrolled' : ''}`}>

        <div className="mx-auto flex max-w-6xl items-center gap-4 px-5 py-3 sm:px-7">
          {/* brand */}
          <Link href="/" className="group flex items-center gap-2.5" aria-label={SITE_NAME}>
            <span className="ef-brand-mark" aria-hidden>EF</span>
            <span className="font-display text-sm font-medium leading-tight tracking-tight text-ink sm:text-base lg:text-lg">
              <span className="sm:hidden">EchoFreelance<span className="ef-muted block text-[10px] font-normal tracking-wide">TECH SCHOOL</span></span><span className="hidden sm:inline">{SITE_NAME}</span>
            </span>
          </Link>

          {/* centre: primary navigation */}
          <nav className="mx-auto hidden items-center gap-1 lg:flex" aria-label="Main">
            <Link href="/courses" aria-current={isActive('/courses') ? 'page' : undefined} className="ef-nav-link">Courses</Link>
            <Link href="/classes" aria-current={isActive('/classes') ? 'page' : undefined} className="ef-nav-link">Live classes</Link>
            <Link href="/discussions" aria-current={isActive('/discussions') ? 'page' : undefined} className="ef-nav-link">Community</Link>
            {role === 'Student' && (
              <Link href="/student" aria-current={isActive('/student') ? 'page' : undefined} className="ef-nav-link">My learning</Link>
            )}
            {role === 'Tutor' && (
              <Link href="/tutor" aria-current={isActive('/tutor') ? 'page' : undefined} className="ef-nav-link">Tutor</Link>
            )}
            {role === 'Admin' && (
              <Link href="/admin" aria-current={isActive('/admin') ? 'page' : undefined} className="ef-nav-link">Admin</Link>
            )}
          </nav>

          {/* right: actions */}
          <div className="ml-auto flex items-center gap-2">
            {router.pathname === '/' && <button className="hidden px-2 py-3 text-xs sm:block" onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', {key:'k',ctrlKey:true,bubbles:true}))}>Search <span className="ml-1 font-mono">Ctrl K</span></button>}
            <button type="button" onClick={() => setTheme(toggleTheme())} className="ef-icon-btn" aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}>
              {theme === 'dark' ? (
                <svg viewBox="0 0 24 24" aria-hidden><circle cx="12" cy="12" r="4.2" /><path d="M12 2.6v2M12 19.4v2M2.6 12h2M19.4 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M18.7 5.3l-1.4 1.4M6.7 17.3l-1.4 1.4" /></svg>
              ) : (
                <svg viewBox="0 0 24 24" aria-hidden><path d="M20 14.2A8.2 8.2 0 1 1 9.8 4a6.6 6.6 0 0 0 10.2 10.2z" /></svg>
              )}
            </button>

            {user && (
              <div className="relative">
                <button type="button" onClick={openBell} className="ef-icon-btn" aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ''}`}>
                  <svg viewBox="0 0 24 24" aria-hidden><path d="M18 8.6a6 6 0 1 0-12 0c0 6-2.2 7.4-2.2 7.4h16.4S18 14.6 18 8.6" /><path d="M13.7 19.8a2 2 0 0 1-3.4 0" /></svg>
                  {unread > 0 && <span className="ef-badge">{unread > 9 ? '9+' : unread}</span>}
                </button>
                {openNotifs && (
                  <div className="ef-popover absolute right-0 mt-3 w-80 max-w-[90vw] p-3">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <p className="ef-eyebrow">Notifications</p>
                      {unread > 0 && (
                        <button type="button" onClick={readAll} className="text-xs text-fern hover:underline">Mark all read</button>
                      )}
                    </div>
                    {notifs.length === 0 ? (
                      <p className="ef-muted text-sm">No notifications yet.</p>
                    ) : (
                      <ul className="max-h-72 space-y-1 overflow-y-auto">
                        {notifs.map((n) => (
                          <li key={n.id}>
                            <button type="button" onClick={() => readOne(n)} className={`w-full rounded-lg px-2.5 py-2 text-left text-sm transition-colors hover:bg-mist ${n.read ? 'opacity-60' : ''}`}>
                              <span className="block font-medium text-ink">{n.title}</span>
                              <span className="ef-muted mt-0.5 block text-xs">{n.body}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            )}

            {user ? (
              <details className="ef-account relative hidden lg:block" key={router.asPath} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node)) event.currentTarget.open = false }}>
                <summary className="ef-btn-ghost !py-2 cursor-pointer select-none text-sm">
                  <span className="ef-avatar !h-6 !w-6 !border-0 !bg-transparent !text-[11px] !text-fern">{(user.name || user.email).slice(0, 2).toUpperCase()}</span>
                  <span className="max-w-[9rem] truncate">{user.name || user.email}</span>
                  <span aria-hidden className="opacity-60">⌄</span>
                </summary>
                <div className="ef-popover absolute right-0 mt-3 w-64 p-2">
                  <p className="px-3 pb-2 pt-1 text-xs ef-muted">
                    {user.email}
                    <span className="ml-1 text-[10px] uppercase tracking-wider text-fern">{role}</span>
                  </p>
                  <hr className="ef-divider my-1" />
                  <Link href="/notes" className="ef-account-action">Notes</Link>
                  <Link href="/certificates/mine" className="ef-account-action">Certificates</Link>
                  <Link href="/settings" className="ef-account-action">Settings</Link>
                  <hr className="ef-divider my-1" />
                  <button type="button" onClick={logout} className="ef-account-action text-red-400">Log out</button>
                </div>
              </details>
            ) : (
              <>
                <Link href="/login" className="hidden rounded-full px-3 py-2 text-sm font-medium text-ink/80 transition-colors hover:text-ink lg:inline-block">Log in</Link>
                <Link href="/register" className="ef-btn hidden !px-4 !py-2 text-sm lg:inline-flex">Join school</Link>
              </>
            )}

            {/* mobile toggle */}
            <button
              type="button"
              className="ef-icon-btn lg:hidden"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              onClick={() => { setMenuOpen((o) => !o); setOpenNotifs(false) }}
            >
              <span className="flex w-[18px] flex-col gap-[5px]" aria-hidden>
                <span className={`block h-[1.5px] w-full bg-ink transition-transform duration-300 ${menuOpen ? 'translate-y-[6.5px] rotate-45' : ''}`} />
                <span className={`block h-[1.5px] w-full bg-ink transition-opacity duration-200 ${menuOpen ? 'opacity-0' : ''}`} />
                <span className={`block h-[1.5px] w-full bg-ink transition-transform duration-300 ${menuOpen ? '-translate-y-[6.5px] -rotate-45' : ''}`} />
              </span>
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="ef-drawer lg:hidden">
            <nav className="flex flex-col gap-1" aria-label="Mobile">
              <p className="ef-drawer-label">Browse</p>
              <Link href="/courses" aria-current={isActive('/courses') ? 'page' : undefined} className="ef-drawer-link" onClick={() => setMenuOpen(false)}>Courses</Link>
              <Link href="/classes" aria-current={isActive('/classes') ? 'page' : undefined} className="ef-drawer-link" onClick={() => setMenuOpen(false)}>Live classes</Link>
              <Link href="/discussions" aria-current={isActive('/discussions') ? 'page' : undefined} className="ef-drawer-link" onClick={() => setMenuOpen(false)}>Community</Link>

              {user ? (
                <>
                  <p className="ef-drawer-label mt-4">Your space</p>
                  {role === 'Student' && (
                    <Link href="/student" aria-current={isActive('/student') ? 'page' : undefined} className="ef-drawer-link" onClick={() => setMenuOpen(false)}>My learning</Link>
                  )}
                  {role === 'Tutor' && (
                    <Link href="/tutor" aria-current={isActive('/tutor') ? 'page' : undefined} className="ef-drawer-link" onClick={() => setMenuOpen(false)}>Tutor desk</Link>
                  )}
                  {role === 'Admin' && (
                    <Link href="/admin" aria-current={isActive('/admin') ? 'page' : undefined} className="ef-drawer-link" onClick={() => setMenuOpen(false)}>Admin</Link>
                  )}
                  <Link href="/notes" className="ef-drawer-link" onClick={() => setMenuOpen(false)}>Notes</Link>
                  <Link href="/certificates/mine" className="ef-drawer-link" onClick={() => setMenuOpen(false)}>Certificates</Link>
                  <Link href="/settings" className="ef-drawer-link" onClick={() => setMenuOpen(false)}>Settings</Link>

                  <div className="mt-4 flex items-center gap-3 rounded-xl px-3 py-3" style={{ background: 'rgb(var(--glass-hi))' }}>
                    <span className="ef-avatar !h-9 !w-9">{(user.name || user.email).slice(0, 2).toUpperCase()}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-ink">{user.name || user.email}</span>
                      <span className="text-[11px] uppercase tracking-wider text-fern">{role}</span>
                    </span>
                  </div>
                  <button type="button" onClick={logout} className="ef-drawer-link mt-1 text-left text-red-400">Log out</button>
                </>
              ) : (
                <>
                  <p className="ef-drawer-label mt-4">Account</p>
                  <Link href="/login" className="ef-drawer-link" onClick={() => setMenuOpen(false)}>Log in</Link>
                  <Link href="/register" className="ef-btn mt-2 w-full justify-center" onClick={() => setMenuOpen(false)}>Join school</Link>
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

      {/* mobile bottom tab bar */}
      <nav className="ef-tabbar lg:hidden" aria-label="Primary">
        <Link href="/" aria-current={router.pathname === '/' ? 'page' : undefined} className="ef-tab">
          <svg viewBox="0 0 24 24" aria-hidden><path d="M3 10.5 12 3l9 7.5" /><path d="M5.5 9.5V20h13V9.5" /></svg>
          <span>Home</span>
        </Link>
        <Link href="/courses" aria-current={isActive('/courses') ? 'page' : undefined} className="ef-tab">
          <svg viewBox="0 0 24 24" aria-hidden><path d="M4 5.5h7a2 2 0 0 1 2 2V19a2 2 0 0 0-2-2H4z" /><path d="M20 5.5h-7a2 2 0 0 0-2 2V19a2 2 0 0 1 2-2h7z" /></svg>
          <span>Courses</span>
        </Link>
        <Link href="/classes" aria-current={isActive('/classes') ? 'page' : undefined} className="ef-tab">
          <svg viewBox="0 0 24 24" aria-hidden><rect x="3" y="5.5" width="13" height="13" rx="2.5" /><path d="m16 12 5-3v9l-5-3z" /></svg>
          <span>Live</span>
        </Link>
        <Link href="/discussions" aria-current={isActive('/discussions') ? 'page' : undefined} className="ef-tab">
          <svg viewBox="0 0 24 24" aria-hidden><path d="M20.5 11.8a8.2 8.2 0 0 1-11.9 7.3L4.2 20.4l1.3-4.3A8.2 8.2 0 1 1 20.5 11.8Z" /></svg>
          <span>Community</span>
        </Link>
        <Link href={user ? '/settings' : '/login'} aria-current={isActive('/settings') ? 'page' : undefined} className="ef-tab">
          <svg viewBox="0 0 24 24" aria-hidden><circle cx="12" cy="8.5" r="3.4" /><path d="M4.8 20a7.4 7.4 0 0 1 14.4 0" /></svg>
          <span>{user ? 'You' : 'Log in'}</span>
        </Link>
      </nav>

      <AskTutor />

      <footer className="ef-footer">
        <div className="mx-auto max-w-6xl px-6 py-14 sm:px-7 sm:py-16">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            <div className="lg:col-span-2">
              <Link href="/" className="flex items-center gap-2.5">
                <span className="ef-brand-mark" aria-hidden>EF</span>
                <span className="font-display text-lg tracking-tight text-ink">{SITE_NAME}</span>
              </Link>
              <p className="ef-muted mt-4 max-w-sm text-sm leading-relaxed">
                Practical courses and live classes in cybersecurity, software and cloud — taught by tutors you can actually talk to.
              </p>
            </div>

            <div>
              <p className="ef-drawer-label">Learn</p>
              <ul className="mt-3 space-y-2.5 text-sm">
                <li><Link href="/courses" className="ef-footer-link">Courses</Link></li>
                <li><Link href="/classes" className="ef-footer-link">Live classes</Link></li>
                <li><Link href="/challenges" className="ef-footer-link">Challenges</Link></li>
                <li><Link href="/discussions" className="ef-footer-link">Community</Link></li>
              </ul>
            </div>

            <div>
              <p className="ef-drawer-label">Your account</p>
              <ul className="mt-3 space-y-2.5 text-sm">
                {user ? (
                  <>
                    <li><Link href="/notes" className="ef-footer-link">Notes</Link></li>
                    <li><Link href="/certificates/mine" className="ef-footer-link">Certificates</Link></li>
                    <li><Link href="/settings" className="ef-footer-link">Settings</Link></li>
                  </>
                ) : (
                  <>
                    <li><Link href="/login" className="ef-footer-link">Log in</Link></li>
                    <li><Link href="/register" className="ef-footer-link">Join the school</Link></li>
                  </>
                )}
              </ul>
            </div>
          </div>

          <hr className="ef-divider my-10" />

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="ef-muted text-xs">© {new Date().getFullYear()} {SITE_NAME}</p>
            <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="ef-footer-link self-start text-xs sm:self-auto">
              Back to top ↑
            </button>
          </div>
        </div>
      </footer>
    </div>
  )
}
