import {Button} from './Button'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { FormEvent, useEffect, useRef, useState } from 'react'

/** Searches the real catalogue; keyboard shortcut is available on every device. */
export function AskAnything() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [value, setValue] = useState('')
  const [isMac, setIsMac] = useState(false)
  useEffect(() => {
    setIsMac(/Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent))
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
  function submit(e: FormEvent) {
    e.preventDefault()
    const q = value.trim()
    router.push(q ? `/courses?q=${encodeURIComponent(q)}` : '/courses')
  }
  return <div>
    <form onSubmit={submit} className="ef-ask" role="search">
      <span className="ef-ask-icon" aria-hidden><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/></svg></span>
      <input ref={inputRef} value={value} onChange={e => setValue(e.target.value)} className="ef-input ef-ask-input" placeholder="Search courses and skills" aria-label="Search courses" type="search" />
      <kbd className="ef-kbd" aria-hidden>{isMac ? '⌘' : 'Ctrl'} K</kbd>
      <Button type="submit" className="ef-btn !min-h-[40px] !px-3 !py-2 text-xs">Search</Button>
    </form>
    <p className="ef-muted mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs"><span>Or explore</span><Link href="/courses" className="underline decoration-line underline-offset-4 hover:text-ink">All courses</Link><Link href="/classes" className="underline decoration-line underline-offset-4 hover:text-ink">Live classes</Link></p>
  </div>
}
