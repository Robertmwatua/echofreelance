import {Button} from './Button'
import Link from 'next/link'
import {createPortal} from 'react-dom'
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
    k: ['where should i start', 'where to start', 'where do i start', 'beginner', 'new to', 'never coded', 'from scratch', 'first course'],
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
    k: ['how much', 'cost', 'price', 'free', 'pay', 'payment', 'payments', 'fee', 'fees'],
    a: 'Your course page shows tuition, the required deposit and any available discount. Pay by M-Pesa, then check confirmed payments and your balance in Fees & receipts. Ask admissions if a payment needs review.',
    links: [{ label: 'See prices', href: '/courses' }],
  },
  {
    id: 'certificate',
    k: ['certificate', 'certification', 'credential', 'proof'],
    a: 'Complete the required lessons and pass the required assignments and quizzes to earn your course certificate. It includes a code that can be verified publicly.',
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
    a: 'For account, fees or course enquiries, contact admissions. You can also ask course questions in the community or at a live class.',
    links: [{ label: 'Talk to admissions', href: '/admissions' }, { label: 'Community', href: '/discussions' }],
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
  const inputRef = useRef<HTMLTextAreaElement>(null)
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

  useEffect(()=>{
    if(!open)return
    const viewport=window.visualViewport
    const resize=()=>{
      panelRef.current?.style.setProperty('--chat-viewport-height',(viewport?.height||window.innerHeight)+'px')
      panelRef.current?.style.setProperty('--chat-viewport-top',(viewport?.offsetTop||0)+'px')
      scroll()
    }
    resize();viewport?.addEventListener('resize',resize);viewport?.addEventListener('scroll',resize)
    return()=>{viewport?.removeEventListener('resize',resize);viewport?.removeEventListener('scroll',resize)}
  },[open,scroll])

  /* other components can open the panel with a question ready */
  useEffect(() => {
    const onAsk = (e: Event) => {
      const q = (e as CustomEvent<{ q?: string }>).detail?.q
      setOpen(true)
      if (q) setValue(q.slice(0,1200))
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
      for (const k of e.k) if (t.includes(' '+k+' ')) n += k.includes(' ') ? 5 : 3
      for (const k of e.w || []) if (t.includes(' '+k+' ')) n += 1
      if (n > score) { score = n; best = e }
    }
    return score >= 3 ? best : null
  }

  function send(text: string) {
    const question = text.trim().slice(0,1200)
    if (!question) return
    const hit = match(question)
    setMsgs(m => [...m,
      { id: ++idRef.current, from: 'me', text: question },
      { id: ++idRef.current, from: 'bot', text: hit?.a || 'I can help with common questions about the school. For this question, contact admissions or ask your course tutor.', links: hit?.links || [{ label: 'Talk to admissions', href: '/admissions' }] },
    ])
    setValue('')
    scroll()
  }

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)} className="ef-tutor-fab" aria-label="Ask for help" aria-expanded={open} aria-controls="ef-school-chat">
        <HelpIcon />
        <span className="school-help-label">Ask for help</span>
      </Button>

      {open && createPortal(
        <>
          <div className="ef-tutor-scrim" onClick={() => setOpen(false)} aria-hidden />
          <aside id="ef-school-chat" ref={panelRef} className="ef-tutor-panel" role="dialog" aria-label="Study assistant" aria-modal="true">
            <header className="ef-tutor-head">
              <span className="ef-ask-icon"><HelpIcon /></span>
              <div className="min-w-0">
                <b className="school-chat-title">School assistant</b>
                <span className="school-chat-subtitle">Automated guide · not a tutor</span>
              </div>
              <Button type="button" className="school-chat-reset" disabled={msgs.length<=1} onClick={()=>{setMsgs([]);setValue('');inputRef.current?.focus()}}>New chat</Button><Button type="button" onClick={() => setOpen(false)} className="ef-icon-btn" aria-label="Close assistant">
                <svg viewBox="0 0 24 24" aria-hidden><path d="M6 6l12 12M18 6L6 18" /></svg>
              </Button>
            </header>

            <div className="ef-tutor-log" ref={logRef} role="log" aria-live="polite">
              {msgs.map((m) => (
                <div key={m.id} className={`ef-bub ${m.from}`}>
                  <span className="school-chat-speaker">{m.from==='me'?'You':'School guide'}</span><p>{m.text}</p>
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
                  <Button key={s} type="button" className="ef-chip" onClick={() => send(s)}>{s}</Button>
                ))}
              </div>
            )}

            <form className="ef-tutor-form" onSubmit={(e) => { e.preventDefault(); send(value) }}>
              <textarea
                ref={inputRef}
                rows={2}
                maxLength={1200}
                aria-describedby="school-chat-disclosure"
                onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.nativeEvent.isComposing){e.preventDefault();send(value)}}}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="ef-ask-input !px-3"
                placeholder="Ask about courses, fees or classes…"
                aria-label="Ask the study assistant"
              />
              <Button type="submit" disabled={!value.trim()} className="ef-btn school-chat-send" aria-label="Send message">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M21.4 3.8 10.3 14.9" /><path d="M21.4 3.8 14.5 20.6l-4.2-5.7-5.7-4.2L21.4 3.8Z" />
                </svg>
              </Button>
            </form><p id="school-chat-disclosure" className="school-chat-disclosure">Automated answers. <Link href="/admissions" onClick={()=>setOpen(false)}>Ask admissions for personal help →</Link></p>
          </aside>
        </>, document.body
      )}
    </>
  )
}
