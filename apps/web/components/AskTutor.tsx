import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Sparkle } from './Sparkle'

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
    a: 'The cybersecurity track covers practical work — finding and fixing real vulnerabilities rather than memorising theory. It helps to be comfortable with the command line first, but it is not required.',
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
    a: 'Pricing is per course and shown on each card — some are free. There is no subscription, so you only pay for what you enrol in.',
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
  const [thinking, setThinking] = useState(false)
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
    if (window.innerWidth > 640) setTimeout(() => inputRef.current?.focus(), 240)
  }, [open, msgs.length])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

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
    if (!text.trim() || thinking) return
    setMsgs((m) => [...m, { id: ++idRef.current, from: 'me', text }])
    setValue('')
    setThinking(true)
    scroll()
    const hit = match(text)
    setTimeout(() => {
      setThinking(false)
      setMsgs((m) => [...m, hit
        ? { id: ++idRef.current, from: 'bot', text: hit.a, links: hit.links }
        : {
            id: ++idRef.current,
            from: 'bot',
            text: 'That one is past me — I only cover the basics. A tutor will give you a proper answer.',
            links: [{ label: 'Ask the community', href: '/discussions' }],
          }])
      scroll()
    }, 650)
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="ef-tutor-fab" aria-label="Ask the study assistant">
        <Sparkle />
        <span className="hidden sm:inline">Ask Tutor</span>
      </button>

      {open && (
        <>
          <div className="ef-tutor-scrim" onClick={() => setOpen(false)} aria-hidden />
          <aside className="ef-tutor-panel" role="dialog" aria-label="Study assistant" aria-modal="true">
            <header className="ef-tutor-head">
              <span className="ef-ask-icon"><Sparkle /></span>
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
              {thinking && (
                <div className="ef-bub bot"><span className="ef-typing"><i /><i /><i /></span></div>
              )}
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
              <button type="submit" className="ef-btn-ai !min-h-0 !px-3.5 !py-2" aria-label="Send">
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
