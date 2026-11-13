import { useRouter } from 'next/router'
import { FormEvent, useEffect, useRef, useState } from 'react'
import { Sparkle } from './Sparkle'

const PROMPTS = [
  'Learn ethical hacking from scratch',
  'I want to build a game in Blender',
  'What should I learn first?',
  'Cloud skills that get me hired',
]

/* only params the catalogue API actually understands */
const CHIPS = [
  { label: 'Cybersecurity', href: '/courses?category=Cybersecurity' },
  { label: 'Software Engineering', href: '/courses?category=Software+Engineering' },
  { label: 'Cloud', href: '/courses?category=Cloud' },
  { label: 'Live this week', href: '/classes' },
]

/** Searches the real course catalogue. Styled as a prompt, honest about being a search. */
export function AskAnything() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [value, setValue] = useState('')
  const [typed, setTyped] = useState('')
  const [isMac, setIsMac] = useState(false)

  useEffect(() => {
    setIsMac(/Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent))
  }, [])

  /* Cmd/Ctrl+K focuses the field */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  /* typewriter placeholder */
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setTyped(PROMPTS[0])
      return
    }
    let i = 0, pos = 0, deleting = false, timer: ReturnType<typeof setTimeout>
    const tick = () => {
      const word = PROMPTS[i]
      pos = deleting ? pos - 1 : pos + 1
      setTyped(word.slice(0, pos))
      let delay = deleting ? 28 : 58
      if (!deleting && pos === word.length) { delay = 2000; deleting = true }
      else if (deleting && pos === 0) { deleting = false; i = (i + 1) % PROMPTS.length; delay = 320 }
      timer = setTimeout(tick, delay)
    }
    timer = setTimeout(tick, 600)
    return () => clearTimeout(timer)
  }, [])

  function submit(e: FormEvent) {
    e.preventDefault()
    const q = value.trim()
    router.push(q ? `/courses?q=${encodeURIComponent(q)}` : '/courses')
  }

  return (
    <div className="w-full">
      <form onSubmit={submit} className="ef-ask ef-sweep" role="search">
        <span className="ef-ask-icon" aria-hidden><Sparkle /></span>
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="ef-ask-input"
          placeholder={typed ? `${typed}|` : 'Search the catalogue'}
          aria-label="Search courses"
          type="search"
        />
        <kbd className="ef-kbd" aria-hidden>{isMac ? '⌘' : 'Ctrl'} K</kbd>
        <button type="submit" className="ef-btn-ai !min-h-0 !px-4 !py-2 text-xs">Search</button>
      </form>

      <ul className="mt-4 flex flex-wrap gap-2">
        {CHIPS.map((c) => (
          <li key={c.label}>
            <a href={c.href} className="ef-chip hover:border-[rgb(var(--grad-c)/0.5)]">{c.label}</a>
          </li>
        ))}
      </ul>
    </div>
  )
}
