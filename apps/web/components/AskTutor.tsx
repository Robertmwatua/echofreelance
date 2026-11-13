import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
function HelpIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden><path d="M5 4h14v12H9l-4 4V4Z" strokeLinejoin="round"/><path d="M9 8h6M9 12h4" strokeLinecap="round"/></svg>
}

type Msg = { id: number; from: 'bot' | 'me'; text: string; links?: { label: string; href: string }[] }

/**
 * Scripted study assistant. No model behind it — keyword matching over a
 * fixed answer set, labelled as automated, handing off to real people for
 * anything it does not cover.
 */
const ANSWERS: { id: string; k: string[]; w?: string[]; a: string; links?: { label: string; href: string }[] }[] = [
  {
    id: 'start',
    k: ['where do i start', 'beginner', 'new to', 'never coded', 'from scratch', 'first course'],
    w: ['start', 'begin', 'learn'],
    a: 'Start with a course marked Beginner — they assume no background. Pick the track that sounds most like the job you want rather than the one that sounds hardest.',
    links: [{ label: 'Browse courses', href: '/courses' }],
  },
  {
    id: 'security',
    k: ['cybersecurity', 'ethical hacking', 'hacking', 'pentest', 'security'],
    a: 'Browse the cybersecurity category and check each course’s level, lessons and prerequisites. The course tutor can help you decide whether it matches your experience.',
    links: [{ label: 'Cybersecurity courses', href: '/courses?category=Cybersecurity' }],
  },
  {
    id: 'live',
    k: ['live class', 'live session', 'virtual class', 'classroom', 'join a class'],
    w: ['live', 'class'],
    a: 'Live classes run in the browser — no install. You enrol in a course, then join the session from Live classes when the tutor starts it. You can ask questions out loud or in chat.',
    links: [{ label: 'See the schedule', href: '/classes' }],
  },
  {
    id: 'price',
    k: ['how much', 'cost', 'price', 'free', 'pay', 'fee'],
    a: 'Each course shows its price on the course page. Check the available enrollment options there, and ask the tutor if you need help with access.',
    links: [{ label: 'See prices', href: '/courses' }],
  },
  {
    id: 'certificate',
    k: ['certificate', 'certification', 'credential', 'proof'],
    a: 'Finish all the lessons in a course and a certificate is issued to your account. It carries a verification code anyone can check.',
    links: [{ label: 'Your certificates', href: '/certificates/mine' }],
  },
  {
    id: 'time',
    k: ['how long', 'how many hours', 'time commitment', 'per week'],
    a: 'Courses are self-paced, so it depends on you. Live classes are the only fixed commitment, and they are scheduled in advance so you can plan around them.',
    links: [{ label: 'Class schedule', href: '/classes' }],
  },
  {
    id: 'human',
    k: ['human', 'real person', 'talk to someone', 'tutor', 'contact'],
    a: 'For anything I cannot answer, ask in the community — tutors read it — or bring it to a live class and ask directly.',
    links: [{ label: 'Community', href: '/discussions' }, { label: 'Live classes', href: '/classes' }],
  },
  {
    id: 'hello',
    k: ['hi', 'hello', 'hey', 'habari', 'niaje'],
    a: 'Hello. I am an automated assistant — I can answer the common questions about courses, classes and certificates. What are you trying to work out?',
  },
]

const SUGGESTIONS = [
  'Where should I start?',
  'How do live classes work?',
  'How much does it cost?',
  'Do I get a certificate?',
]

export function AskTutor() {
  const [open, setOpen] = useState(false)
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [value, setValue] = useState('')
  const panelRef = useRef<HTMLElement>(null)
  const logRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const idRef = useRef(0)

  const scroll = useCallback(() => {
    requestAnimationFrame(() => { if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight })
  }, [])

  useEffect(() => {
    if (!open) return
    if (msgs.length === 0) {
      setMsgs([{
        id: ++idRef.current,
        from: 'bot',
        text: 'Hi — I am an automated study assistant, not a tutor. I can answer the common questions, and point you to a real person for anything else.',
      }])
    }
  }, [open, msgs.length])

  useEffect(() => {
    if (!open) return
    const panel = panelRef.current
    if (!panel) return
    const previousFocus = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow
    const siblings = Array.from(panel.parentElement?.children || [])
      .filter(el => el !== panel && !el.classList.contains('ef-tutor-scrim'))
      .map(el => ({ el, inert: el.hasAttribute('inert') }))
    siblings.forEach(({ el }) => el.setAttribute('inert', ''))
    document.body.style.overflow = 'hidden'
    inputRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
      if (e.key !== 'Tab') return
      const items = Array.from(panel.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled]), [tabindex="0"]'))
      const first = items[0], last = items[items.length - 1]
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus() }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      siblings.forEach(({ el, inert }) => { if (!inert) el.removeAttribute('inert') })
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKey)
      previousFocus?.focus()
    }
  }, [open])

  /* other components can open the panel with a question ready */
  useEffect(() => {
    const onAsk = (e: Event) => {
      const q = (e as CustomEvent<{ q?: string }>).detail?.q
      setOpen(true)
      if (q) setValue(q)
    }
    window.addEventListener('ef:ask-tutor', onAsk as EventListener)
    return () => window.removeEventListener('ef:ask-tutor', onAsk as EventListener)
  }, [])

  function match(text: string) {
    const t = ` ${text.toLowerCase().replace(/[^a-z0-9\s']/g, ' ').replace(/\s+/g, ' ')} `
    let best: typeof ANSWERS[number] | null = null
    let score = 0
    for (const e of ANSWERS) {
      let n = 0
      for (const k of e.k) if (t.includes(k)) n += k.includes(' ') ? 5 : 3
      for (const k of e.w || []) if (t.includes(k)) n += 1
      if (n > score) { score = n; best = e }
    }
    return score >= 3 ? best : null
  }

  function send(text: string) {
    const question = text.trim()
    if (!question) return
    const hit = match(question)
    setMsgs(m => [...m,
      { id: ++idRef.current, from: 'me', text: question },
      { id: ++idRef.current, from: 'bot', text: hit?.a || 'I can help with common questions about the school. For this question, ask a tutor in the community.', links: hit?.links || [{ label: 'Ask the community', href: '/discussions' }] },
    ])
    setValue('')
    scroll()
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="ef-tutor-fab" aria-label="Ask the study assistant">
        <HelpIcon />
        <span>Study help</span>
      </button>

      {open && (
        <>
          <div className="ef-tutor-scrim" onClick={() => setOpen(false)} aria-hidden />
          <aside ref={panelRef} className="ef-tutor-panel" role="dialog" aria-label="Study assistant" aria-modal="true">
            <header className="ef-tutor-head">
              <span className="ef-ask-icon"><HelpIcon /></span>
              <div className="min-w-0">
                <b className="block text-sm font-semibold text-ink">Study assistant</b>
                <span className="font-accent text-[10px] uppercase tracking-[0.16em] text-fern">Automated · not a tutor</span>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="ef-icon-btn ml-auto !h-9 !w-9" aria-label="Close">
                <svg viewBox="0 0 24 24" aria-hidden><path d="M6 6l12 12M18 6L6 18" /></svg>
              </button>
            </header>

            <div className="ef-tutor-log" ref={logRef} role="log" aria-live="polite">
              {msgs.map((m) => (
                <div key={m.id} className={`ef-bub ${m.from}`}>
                  <p>{m.text}</p>
                  {m.links && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {m.links.map((l) => (
                        <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="ef-chip">{l.label}</Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}

            </div>

            {msgs.length <= 1 && (
              <div className="ef-tutor-suggest">
                {SUGGESTIONS.map((s) => (
                  <button key={s} type="button" className="ef-chip" onClick={() => send(s)}>{s}</button>
                ))}
              </div>
            )}

            <form className="ef-tutor-form" onSubmit={(e) => { e.preventDefault(); send(value) }}>
              <input
                ref={inputRef}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="ef-ask-input !px-3"
                placeholder="Ask about courses, classes, certificates…"
                aria-label="Ask the study assistant"
              />
              <button type="submit" className="ef-btn !min-h-0 !px-3.5 !py-2" aria-label="Send">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M21.4 3.8 10.3 14.9" /><path d="M21.4 3.8 14.5 20.6l-4.2-5.7-5.7-4.2L21.4 3.8Z" />
                </svg>
              </button>
            </form>
          </aside>
        </>
      )}
    </>
  )
}
