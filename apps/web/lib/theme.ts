const KEY = 'ef_theme'

export type Theme = 'dark' | 'light'

export function getStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'dark'
  const v = localStorage.getItem(KEY)
  return v === 'light' ? 'light' : 'dark'
}

export function applyTheme(theme: Theme) {
  if (typeof document === 'undefined') return
  document.documentElement.classList.toggle('dark', theme === 'dark')
  localStorage.setItem(KEY, theme)
}

export function toggleTheme(): Theme {
  const next = getStoredTheme() === 'dark' ? 'light' : 'dark'
  applyTheme(next)
  return next
}
