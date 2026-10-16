import { LiveDot } from '../../components/LiveDot'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import DocumentHead from '../../components/DocumentHead'
import { CardSkeletons, FeedbackCard, PageHero } from '../../components/PageFeedback'
import { api, CATEGORIES, classStatusLabel, formatWhen, googleCalendarUrl, VirtualClass } from '../../lib/api'

type Filter = 'All' | 'Live' | 'Upcoming'
const previews = [
  { title: 'Inside the security lab', category: 'Cybersecurity', topic: 'Investigate, test, and discuss real-world security concepts.', host: 'Security tutor', time: '60-minute interactive lab' },
  { title: 'Build it together', category: 'Software Engineering', topic: 'Work through a practical coding problem with a tutor.', host: 'Software tutor', time: '90-minute guided workshop' },
  { title: 'Cloud fundamentals, in practice', category: 'Cloud', topic: 'Explore infrastructure through a guided classroom session.', host: 'Cloud tutor', time: '60-minute live walkthrough' },
]

export default function ClassesPage() {
  const [classes, setClasses] = useState<VirtualClass[]>([])
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)
  const [attempt, setAttempt] = useState(0)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')
  const [filter, setFilter] = useState<Filter>('All')

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(false)
    api.classes().then(data => { if (active) setClasses(data) })
      .catch(() => { if (active) setError(true) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [attempt])

  const categories = useMemo(() => Array.from(new Set([...CATEGORIES, ...classes.map(c => c.course?.category).filter((c): c is string => Boolean(c))])), [classes])
  const visible = useMemo(() => classes.filter(c => {
    const text = `${c.title} ${c.description || ''} ${c.host?.name || ''} ${c.course?.title || ''}`.toLowerCase()
    return text.includes(query.trim().toLowerCase()) && (!category || c.course?.category === category)
      && (filter === 'All' || (filter === 'Live' ? c.status === 'Live' : c.status === 'Scheduled' && new Date(c.endsAt).getTime() > Date.now()))
  }).sort((a, b) => Number(b.status === 'Live') - Number(a.status === 'Live') || new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()), [classes, query, category, filter])
  const clear = () => { setQuery(''); setCategory(''); setFilter('All') }

  return <>
    <DocumentHead title="Live classes — EchoFreelance Tech School" />
    <main className="mx-auto max-w-6xl px-6 py-10 sm:py-12">
      <PageHero eyebrow="Make room for discovery" title="Live classes" description="Work through ideas with your tutors and classmates. Find a live lab, bring your questions, and learn something you can put to work.">
        <span className="ef-pill-live">{!loading && !error && classes.some(c => c.status === 'Live') && <LiveDot />}{loading || error ? 'Live classroom' : `${classes.filter(c => c.status === 'Live').length} live now`}</span>
        <span className="ef-pill">Interactive labs</span><span className="ef-pill">Upcoming sessions</span>
      </PageHero>
      <section aria-label="Filter live classes" className="ef-toolbar mt-6">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row"><input aria-label="Search live classes" placeholder="Search classes or tutors…" value={query} onChange={e => setQuery(e.target.value)} className="ef-input sm:min-w-0 sm:flex-1" /><select aria-label="Class category" value={category} onChange={e => setCategory(e.target.value)} className="ef-input sm:!w-56"><option value="">All categories</option>{categories.map(c => <option key={c}>{c}</option>)}</select></div>
        <div role="group" aria-label="Session status" className="flex flex-wrap gap-2">{(['All', 'Live', 'Upcoming'] as Filter[]).map(tab => <button key={tab} aria-pressed={filter === tab} onClick={() => setFilter(tab)} className="ef-filter">{tab}</button>)}</div>
      </section>
      {loading ? <CardSkeletons label="Loading live classes" /> : error ? <>
        <FeedbackCard error title="Unable to load live classes" description="We couldn’t connect to the classroom schedule. Check your connection or try again in a moment. Your filters will stay in place." retry={() => setAttempt(a => a + 1)} action={{ href: '/courses', label: 'Explore courses' }} />
        <section className="mt-10" aria-label="Sample class previews"><div className="mb-5 flex flex-wrap items-center justify-between gap-3"><h2 className="font-display text-2xl">A look inside the classroom</h2><span className="ef-pill">Illustrative previews · not scheduled</span></div><div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{previews.map(p => <article key={p.title} className="ef-session-card flex flex-col"><p className="ef-eyebrow">{p.category}</p><h3 className="mt-4 font-display text-2xl">{p.title}</h3><p className="ef-muted mt-3 text-sm leading-6">{p.topic}</p><div className="mt-6 flex items-center gap-3"><span className="ef-avatar" aria-hidden="true">{p.host.split(' ').map(w => w[0]).join('')}</span><div><p className="text-sm font-semibold">{p.host}</p><p className="ef-meta">Sample instructor</p></div></div><p className="ef-meta my-6 border-t border-line pt-4">{p.time}</p><button disabled className="ef-btn-ghost mt-auto">Preview only</button></article>)}</div></section>
      </> : visible.length ? <><p className="ef-meta mt-8" role="status">{visible.length} {visible.length === 1 ? 'session' : 'sessions'} to explore</p><ul className="mt-4 grid gap-6 md:grid-cols-2 lg:grid-cols-3">{visible.map(item => <li key={item.id} className="ef-session-card flex flex-col"><div className="flex items-center justify-between gap-3"><span className={item.status === 'Live' ? 'ef-pill-live' : 'ef-pill'}>{item.status === 'Live' && <LiveDot />}{classStatusLabel(item.status)}</span><span className="ef-meta">{item.course?.category || 'Live class'}</span></div><h2 className="mt-5 font-display text-2xl"><Link href={`/classes/${item.id}`} className="hover:underline underline-offset-4">{item.title}</Link></h2><p className="ef-muted mt-3 line-clamp-2 text-sm leading-6">{item.description || item.course?.title || 'A guided session with your learning community.'}</p><div className="mt-6 flex items-center gap-3"><span className="ef-avatar" aria-hidden="true">{(item.host?.name || 'Tutor').split(' ').slice(0, 2).map(w => w[0]).join('')}</span><div className="min-w-0"><p className="truncate text-sm font-semibold">{item.host?.name || 'Course tutor'}</p><p className="ef-meta">Session instructor</p></div></div><div className="my-6 border-y border-line py-4"><p className="text-sm font-medium">{formatWhen(item.startsAt)}</p><p className="ef-meta mt-1">{Math.max(0, Math.round((new Date(item.endsAt).getTime() - new Date(item.startsAt).getTime()) / 60000))} minutes{item.attendanceCount != null ? ` · ${item.attendanceCount} registered` : ''}</p></div><div className="mt-auto flex flex-wrap gap-2"><Link href={`/classes/${item.id}`} className="ef-btn">{item.canEnterRoom ? 'Join session' : 'View session'}</Link><a href={googleCalendarUrl({ title: item.title, startsAt: item.startsAt, endsAt: item.endsAt, details: item.description || item.course?.title || '', location: 'EchoFreelance classroom' })} target="_blank" rel="noreferrer" className="ef-btn-ghost" aria-label={`Add ${item.title} to calendar`}>Calendar</a></div></li>)}</ul></> : <FeedbackCard title={classes.length ? 'No sessions match your filters' : 'The next session is still to come'} description={classes.length ? 'Try a different topic, category, or session status.' : 'Tutors are preparing the next round of live classes. Explore a course while you wait.'} action={{ href: '/courses', label: 'Explore courses' }} />}
      {!loading && !error && !visible.length && classes.length > 0 && <button onClick={clear} className="ef-btn-ghost mt-4">Clear filters</button>}
    </main>
  </>
}
